import { componentPath, type ComponentPath } from ".";
import { foldNode, type Node } from "../dom";
import { getId } from "../dom/attrs";
import { type Component } from "../dom/components";
import { nodeId } from "../dom/nodeid";
import type { Effect } from "../effects";
import { eq, exhaustivenessCheck } from "../utils";
import { EventManager } from "./eventmgr";
import type { Interpreter } from "./interpreter";
import type { RealDocument, RealElement, RealWindow } from "./realdom";
import type { StyleRegistry } from "./styleregistry";
import { TaskRegistry } from "./taskreg";
import {
  closestComponentPath,
  componentNode,
  detach,
  internalElementNode,
  internalTextNode,
  rootNode,
  updateAttrs,
  updateProps,
  updateText,
  viewNode,
  type ComponentNode,
  type ComponentState,
  type InternalNode,
  type ParentNode,
  type RootNode,
  type ViewNode,
} from "./vdom";

export function manageComponent<State, Params, Event>(
  component: Component<State, Params, Event>,
  mountId: string,
  window: RealWindow,
  interpreter: Interpreter,
  styleRegistry: StyleRegistry,
): { dispatchEffect: (effect: Effect<State, Event, void>) => void } {
  const mountNode = window.document.getElementById(mountId);
  if (!mountNode) {
    throw new Error(
      `Cannot attach component tree. Root node with id ${mountId} not found`,
    );
  }
  const mgr = new ComponentManager(
    component as Component<unknown, unknown, unknown>,
    mountNode,
    window,
    interpreter,
    styleRegistry,
  );
  return {
    dispatchEffect: (effect) =>
      mgr.dispatchEffect(effect as Effect<unknown, unknown, void>),
  };
}

export class ComponentManager {
  private rootCompPath: ComponentPath;

  private components: {
    [key: string]: ComponentNode;
  } = {};

  private removedComponents: {
    [key: string]: ComponentNode;
  } = {};

  // Mirrors `components` but for view()/fixedView() subtrees, which have no
  // state of their own but still need stable identity so their onRender
  // effects don't refire whenever an ancestor element is rebuilt (or, via
  // alreadyMountedPaths, whenever a fresh ComponentManager remounts them).
  // Keyed the same way as components: nodeId + enclosing *component* path
  // (nesting through another view doesn't add a path segment).
  private views: {
    [key: string]: ViewNode;
  } = {};

  private addedComponents: ComponentPath[] = [];

  private pendingRenderEffects: {
    path: ComponentPath;
    effects: readonly Effect<unknown, unknown, void>[];
  }[] = [];

  private interpreter: Interpreter;

  private window: RealWindow;
  private document: RealDocument;

  private eventManager: EventManager;
  private taskRegistry: TaskRegistry = new TaskRegistry();
  private styleRegistry: StyleRegistry;

  private onRootEvent: ((event: unknown) => void) | undefined;

  // Paths that were already mounted (and had their onRender effects fired)
  // by some earlier, unrelated ComponentManager instance -- e.g. a prior
  // `.run()` call in ctrl-fx/testing, which mounts a fresh ComponentManager
  // each time but wants onRender to still behave as if the component tree
  // had persisted. Suppresses re-queueing onRender effects for those paths
  // without affecting real first-time mounts.
  private alreadyMountedPaths: ReadonlySet<string>;

  constructor(
    component: Component<unknown, unknown, unknown>,
    mountNode: RealElement,
    window: RealWindow,
    interpreter: Interpreter,
    styleRegistry: StyleRegistry,
    onRootEvent?: (event: unknown) => void,
    alreadyMountedPaths?: ReadonlySet<string>,
  ) {
    this.window = window;
    this.document = this.window.document;
    this.interpreter = interpreter;
    this.styleRegistry = styleRegistry;
    this.onRootEvent = onRootEvent;
    this.alreadyMountedPaths = alreadyMountedPaths ?? new Set();

    this.eventManager = new EventManager(
      this.window,
      (effect, node, onResult) => {
        const componentPath = closestComponentPath(node);
        if (componentPath) {
          this.runEffect(effect, componentPath, onResult);
        }
      },
    );

    const rootCompPath = componentPath(nodeId("__root_component"));
    this.rootCompPath = rootCompPath;

    const compNode = componentNode(component, rootCompPath.nodeId);

    const root: RootNode = rootNode(mountNode);
    root.append(compNode);
    this.components[componentPath(compNode.nodeId, undefined).format()] =
      compNode;

    this.injectComponentCss(component);

    const initStateEffect = component.initialState(component.params);

    this.runEffect(initStateEffect, rootCompPath, (state) => {
      this.renderComponent(rootCompPath, state);
    });
  }

  private injectComponentCss(
    component: Component<unknown, unknown, unknown>,
  ): void {
    if (!component.css) return;
    const css =
      typeof component.css === "function"
        ? component.css(component.params)
        : component.css;
    this.styleRegistry.injectStyle(css);
  }

  getRootState(): ComponentState {
    return (
      this.components[this.rootCompPath.format()]?.state ?? {
        _type: "Uninitialized",
      }
    );
  }

  /** Paths of components (past their initial render) and views currently mounted. */
  getMountedPaths(): ReadonlySet<string> {
    const componentPaths = Object.entries(this.components)
      .filter(([, node]) => node.state._type === "Ready")
      .map(([path]) => path);
    return new Set([...componentPaths, ...Object.keys(this.views)]);
  }

  dispatchEffect(effect: Effect<unknown, unknown, void>): void {
    this.runEffect(effect, this.rootCompPath, () => {});
  }

  destroy(): void {
    this.taskRegistry.cancelAll();
  }

  private runEffect<A>(
    effect: Effect<unknown, unknown, A>,
    componentPath: ComponentPath,
    f: (a: A) => void,
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    this.interpreter(
      effect,
      {
        onComplete: f,
        onFireEvent: (event) => {
          const component = this.components[componentPath.format()];
          if (component) {
            const parentCompPath = componentPath.parentComponentPath;
            if (parentCompPath) {
              component.componentEventListeners.forEach((listener) => {
                const effect = listener(event);
                this.runEffect(effect, parentCompPath, () => {});
              });
            } else {
              this.onRootEvent?.(event);
            }
          }
        },
        getState: () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (that.components[componentPath.format()].state as any).value;
        },
        setState: (state: unknown) => {
          that.renderComponent(componentPath, state);
        },
      },
      this.taskRegistry,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private renderComponent(componentPath: ComponentPath, state: any): void {
    const component = this.components[componentPath.format()];
    if (!component) {
      return;
    }

    // if state hasn't changed, nothing to do
    if (component.state._type === "Ready" && eq(component.state.value, state)) {
      return;
    }

    const isInitialMount = component.state._type === "Uninitialized";
    const wasAlreadyMounted = this.alreadyMountedPaths.has(componentPath.format());

    component.state = { _type: "Ready", value: state };

    const newNodeGroup = component.component.view(
      state,
      component.component.params,
    );

    if (isInitialMount && !wasAlreadyMounted && newNodeGroup.renderEffects.length > 0) {
      this.pendingRenderEffects.push({
        path: componentPath,
        effects: newNodeGroup.renderEffects,
      });
    }

    component.containerListeners = newNodeGroup.containerListeners;

    this.eventManager.setContainerListeners(component);

    const oldNodes = component.firstChild;

    this.compareNodeSequences(
      oldNodes,
      newNodeGroup.nodes,
      component,
      componentPath,
    );

    const added = this.addedComponents.splice(0);
    added.forEach((childPath) => {
      const cNode = this.components[childPath.format()];
      if (cNode) {
        const initEffect = cNode.component.initialState(cNode.component.params);
        this.runEffect(initEffect, childPath, (state) => {
          this.renderComponent(childPath, state);
        });
      }
    });

    // Flush render effects queued for this render pass (this component's own
    // onRender effects, plus any from views newly mounted directly within it)
    // now that the DOM for the whole pass has been built. Deferred rather than
    // run inline during diffing, since an effect could synchronously trigger
    // another render of a component whose vdom tree is still being traversed.
    const pending = this.pendingRenderEffects.splice(0);
    pending.forEach(({ path, effects }) => {
      effects.forEach((effect) => this.runEffect(effect, path, () => {}));
    });
  }

  private compareNodeSequences(
    oldNodes: InternalNode | undefined,
    newNodes: readonly Node<unknown, unknown>[],
    parent: ParentNode,
    ancestorComponentPath: ComponentPath,
  ): void {
    const mutNewNodes = [...newNodes];

    while (mutNewNodes.length > 0) {
      const newNode = mutNewNodes.shift()!;

      const correspondingOldNode = this.findCorrespondingOldNode(
        newNode,
        oldNodes,
        ancestorComponentPath,
      );

      if (correspondingOldNode) {
        if (correspondingOldNode !== oldNodes) {
          oldNodes?.before(correspondingOldNode);
        }
        this.compareNodes(correspondingOldNode, newNode, ancestorComponentPath);
        oldNodes = correspondingOldNode.nextSibling;
      } else {
        const newInternalNode = this.convertNodeToInternalNode(
          newNode,
          ancestorComponentPath,
        );
        if (oldNodes) {
          oldNodes.before(newInternalNode);
        } else {
          parent.append(newInternalNode);
        }
      }
    }

    let oldNode = oldNodes;

    while (oldNode) {
      const next = oldNode.nextSibling;
      this.removeNode(oldNode, ancestorComponentPath);
      oldNode = next;
    }
  }

  private removeNode(
    oldNode: InternalNode,
    ancestorComponentPath: ComponentPath,
  ): void {
    detach(oldNode);

    // TODO: event listeners

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;

    function removeNodeRecords(
      node: InternalNode,
      ancestorComponentPath: ComponentPath,
    ): void {
      switch (node._type) {
        case "InternalTextNode":
          return;
        case "InternalElementNode": {
          that.eventManager.setElementListeners(node);
          return;
        }
        case "ViewNode": {
          that.eventManager.setContainerListeners(node);
          const viewPath = componentPath(
            node.nodeId,
            ancestorComponentPath,
          ).format();
          delete that.views[viewPath];
          return;
        }
        case "ComponentNode": {
          that.eventManager.setContainerListeners(node);
          const compPath = componentPath(
            node.nodeId,
            ancestorComponentPath,
          ).format();
          delete that.components[compPath];
          that.removedComponents[compPath] = node;
          return;
        }
      }
    }

    foldTree(
      oldNode,
      ancestorComponentPath,
      undefined,
      (node, ancestorComponentId) => {
        removeNodeRecords(node, ancestorComponentId);
      },
    );
  }

  private compareNodes(
    oldNode: InternalNode,
    newNode: Node<unknown, unknown>,
    ancestorComponentPath: ComponentPath,
  ): void {
    const parent = oldNode.parent;

    const removeOldAndAddNew = () => {
      const nextSibling = oldNode.nextSibling;
      this.removeNode(oldNode, ancestorComponentPath);
      const newInternalNode = this.convertNodeToInternalNode(
        newNode,
        ancestorComponentPath,
      );
      if (nextSibling) {
        nextSibling.after(newInternalNode);
      } else if (parent) {
        parent.append(newInternalNode);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;

    foldNode(newNode, {
      onText(text) {
        if (oldNode._type !== "InternalTextNode") {
          removeOldAndAddNew();
          return;
        }

        updateText(oldNode, text);
      },

      onVoidElement(elem) {
        if (
          oldNode._type !== "InternalElementNode" ||
          oldNode.tag !== elem.tag
        ) {
          removeOldAndAddNew();
          return;
        }

        updateAttrs(oldNode, elem.attrs);
        updateProps(oldNode, elem.props);
        if (
          oldNode.eventListeners.length > 0 ||
          elem.eventListeners.length > 0
        ) {
          oldNode.eventListeners = elem.eventListeners;
          that.eventManager.setElementListeners(oldNode);
        }
      },

      onNonVoidElement(elem) {
        if (
          oldNode._type !== "InternalElementNode" ||
          oldNode.tag !== elem.tag
        ) {
          removeOldAndAddNew();
          return;
        }

        updateAttrs(oldNode, elem.attrs);
        updateProps(oldNode, elem.props);
        if (oldNode.eventListeners.length > 0) {
          oldNode.eventListeners = elem.eventListeners;
          that.eventManager.setElementListeners(oldNode);
        }

        that.compareNodeSequences(
          oldNode.firstChild,
          elem.children,
          oldNode,
          ancestorComponentPath,
        );
      },

      onView(view) {
        if (oldNode._type !== "ViewNode" || !oldNode.nodeId.eq(view.nodeId)) {
          removeOldAndAddNew();
          return;
        }

        if (eq(oldNode.params, view.params)) {
          return;
        }

        const newNodeGroup = view.nodes(view.params);
        oldNode.params = view.params;
        oldNode.containerListeners = newNodeGroup.containerListeners;

        that.eventManager.setContainerListeners(oldNode);

        that.compareNodeSequences(
          oldNode.firstChild,
          newNodeGroup.nodes,
          oldNode,
          ancestorComponentPath,
        );
      },

      onComponent(comp) {
        if (
          oldNode._type !== "ComponentNode" ||
          !oldNode.nodeId.eq(comp.nodeId)
        ) {
          removeOldAndAddNew();
          return;
        }

        if (oldNode.state._type === "Ready") {
          if (
            oldNode.componentEventListeners.length > 0 ||
            comp.componentEventListeners.length > 0
          ) {
            oldNode.componentEventListeners = comp.componentEventListeners;
            that.eventManager.setContainerListeners(oldNode);
          }

          if (eq(oldNode.component.params, comp.component.params)) {
            oldNode.component = comp.component;
          } else {
            that.injectComponentCss(comp.component);

            const newNodeGroup = comp.component.view(
              oldNode.state.value,
              comp.component.params,
            );

            oldNode.containerListeners = newNodeGroup.containerListeners;
            that.eventManager.setContainerListeners(oldNode);

            oldNode.component = comp.component;

            that.compareNodeSequences(
              oldNode.firstChild,
              newNodeGroup.nodes,
              oldNode,
              componentPath(comp.nodeId, ancestorComponentPath),
            );
          }
        } else {
          oldNode.component = comp.component;
        }
      },
    });
  }

  private convertNodeToInternalNode(
    node: Node<unknown, unknown>,
    ancestorComponentId: ComponentPath,
  ): InternalNode {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;

    return foldNode(node, {
      onText(text) {
        return internalTextNode(that.document, text) as InternalNode;
      },
      onVoidElement(elem) {
        const internalElem = internalElementNode(
          that.document,
          elem.tag,
          elem.nodeId,
          elem.attrs,
          elem.eventListeners,
          elem.props,
        );

        if (elem.eventListeners.length > 0) {
          that.eventManager.setElementListeners(internalElem);
        }

        return internalElem;
      },

      onNonVoidElement(elem) {
        const internalElement = internalElementNode(
          that.document,
          elem.tag,
          elem.nodeId,
          elem.attrs,
          elem.eventListeners,
          elem.props,
        );

        if (elem.eventListeners.length > 0) {
          that.eventManager.setElementListeners(internalElement);
        }

        elem.children.forEach((childNode) => {
          internalElement.append(
            that.convertNodeToInternalNode(childNode, ancestorComponentId),
          );
        });

        return internalElement;
      },

      onView(view) {
        const viewId = componentPath(view.nodeId, ancestorComponentId).format();

        const existingView = that.views[viewId];

        if (existingView) {
          detach(existingView);
          that.compareNodes(existingView, view, ancestorComponentId);
          return existingView;
        }

        const vNode = viewNode(view);
        const nodeGroup = view.nodes(view.params);
        vNode.params = view.params;
        vNode.containerListeners = nodeGroup.containerListeners;
        nodeGroup.nodes.forEach((childNode) => {
          vNode.append(
            that.convertNodeToInternalNode(childNode, ancestorComponentId),
          );
        });
        that.eventManager.setContainerListeners(vNode);
        that.views[viewId] = vNode;
        if (!that.alreadyMountedPaths.has(viewId) && nodeGroup.renderEffects.length > 0) {
          that.pendingRenderEffects.push({
            path: ancestorComponentId,
            effects: nodeGroup.renderEffects,
          });
        }
        return vNode;
      },

      onComponent(comp) {
        const compId = componentPath(comp.nodeId, ancestorComponentId).format();

        const existingComp = that.components[compId];

        if (existingComp) {
          detach(existingComp);
          that.compareNodes(existingComp, comp, ancestorComponentId);
          return existingComp;
        }

        const cNode = componentNode(comp.component, comp.nodeId);
        if (comp.componentEventListeners.length > 0) {
          cNode.componentEventListeners = comp.componentEventListeners;
          that.eventManager.setContainerListeners(cNode);
        }

        that.injectComponentCss(comp.component);
        that.components[compId] = cNode;
        that.addedComponents.push(
          componentPath(comp.nodeId, ancestorComponentId),
        );
        return cNode;
      },
    });
  }

  //   private compareNodes(
  //     oldNode: InternalNode,
  //     newNode: Node<unknown, unknown>,
  //     parent: RealElement,
  //     prevSibling: RealNode | null,
  //     ancestorComponentId: ComponentId
  //   ): RealNode | null {
  //     if (typeof (newNode) === 'string') {
  //       if (oldNode._type === 'InternalTextNode') {
  //         if (oldNode.text !== newNode) {
  //           oldNode.realNode.nodeValue = newNode
  //         }
  //         return oldNode.realNode
  //       }
  //       this.removeNode(oldNode)
  //       return this.addNode1(newNode, parent, prevSibling, ancestorComponentId)
  //     }

  //     switch (newNode._type) {

  //       case 'Element': {
  //         if (
  //           oldNode._type === 'InternalElementNode' &&
  //           newNode.tag === oldNode.tag
  //         ) {

  //           this.compareElements(oldNode, newNode)
  //           return oldNode.realNode
  //         } else {
  //           this.removeNode(oldNode)
  //           return this.addNode1(newNode, parent, prevSibling, ancestorComponentId)
  //         }
  //       }

  //       case 'Component': {
  //         return todo()
  //       }

  //       case 'View': {
  //         return todo()
  //       }
  //     }
  //   }

  /**
   * Return an old node that can be compared to `newNode`.
   *
   * If the old node represent the same node as `newNode`, return it.
   *
   * If the same node isn't found, return the first node if it is `comparable`,
   * otherwise return undefined. (We don't move nodes if they are comparable but
   * not the same).
   */
  private findCorrespondingOldNode(
    newNode: Node<unknown, unknown>,
    oldNodes: InternalNode | undefined,
    ancestorComponentPath: ComponentPath,
  ): InternalNode | undefined {
    if (typeof newNode !== "string" && newNode._type === "Component") {
      const registeredComponent =
        this.components[
          componentPath(newNode.nodeId, ancestorComponentPath).format()
        ];
      if (registeredComponent) {
        return registeredComponent;
      }
    }

    if (typeof newNode !== "string" && newNode._type === "View") {
      const registeredView =
        this.views[
          componentPath(newNode.nodeId, ancestorComponentPath).format()
        ];
      if (registeredView) {
        return registeredView;
      }
    }

    let next: InternalNode | undefined = oldNodes;
    while (next) {
      if (getNodesRelationship(next, newNode) === "same") {
        return next;
      }

      next = next.nextSibling;
    }

    if (oldNodes) {
      if (getNodesRelationship(oldNodes, newNode) === "comparable") {
        return oldNodes;
      }
    }

    return undefined;
  }
}

//   private removeNode(_node: InternalNode): void {

//   }

//   private compareElements(
//     _oldNode: InternalElementNode,
//     _newNode: Element<unknown, unknown>
//   ): void { }
// }

function getNodesRelationship(
  oldNode: InternalNode,
  newNode: Node<unknown, unknown>,
): "same" | "unrelated" | "comparable" {
  if (typeof newNode === "string") {
    return oldNode._type === "InternalTextNode" ? "comparable" : "unrelated";
  }

  if (oldNode._type === "InternalTextNode") {
    return "unrelated";
  }

  switch (newNode._type) {
    case "Element": {
      if (oldNode._type === "InternalElementNode") {
        if (newNode.nodeId) {
          if (oldNode.nodeId) {
            return newNode.nodeId.eq(oldNode.nodeId) ? "same" : "unrelated";
          }
        } else if (oldNode.nodeId) {
          return "unrelated";
        }

        const oldId = getId(oldNode.attrs);
        const newId = getId(newNode.attrs);

        if (newId) {
          if (oldId) {
            return oldId === newId ? "same" : "unrelated";
          } else {
            return "unrelated";
          }
        } else if (oldId) {
          return "unrelated";
        }

        return oldNode.tag === newNode.tag ? "comparable" : "unrelated";
      } else {
        return "unrelated";
      }
    }
    case "View":
      if (oldNode._type === "ViewNode") {
        return newNode.nodeId.eq(oldNode.nodeId) ? "same" : "unrelated";
      } else {
        return "unrelated";
      }
    case "Component":
      if (oldNode._type === "ComponentNode") {
        return newNode.nodeId.eq(oldNode.nodeId) ? "same" : "unrelated";
      } else {
        return "unrelated";
      }
  }
}

export function foldTree<A>(
  root: InternalNode,
  ancestorComponentPath: ComponentPath,
  init: A,
  f: (node: InternalNode, ancestorComponentId: ComponentPath, acc: A) => A,
): A {
  let acc = init;

  function visit(
    n: InternalNode,
    ancestorComponentPath: ComponentPath,
    moveThroushSiblings: boolean,
  ) {
    acc = f(n, ancestorComponentPath, acc);
    switch (n._type) {
      case "InternalTextNode": {
        break;
      }
      case "InternalElementNode":
      case "ViewNode": {
        if (n.firstChild) {
          visit(n.firstChild, ancestorComponentPath, true);
        }
        break;
      }
      case "ComponentNode": {
        if (n.firstChild) {
          visit(
            n.firstChild,
            componentPath(n.nodeId, ancestorComponentPath),
            true,
          );
        }
        break;
      }

      default: {
        exhaustivenessCheck(n);
      }
    }

    if (moveThroushSiblings) {
      let next = n.nextSibling;
      while (next) {
        visit(next, ancestorComponentPath, false);
        next = next.nextSibling;
      }
    }
  }

  visit(root, ancestorComponentPath, false);
  return acc;
}
