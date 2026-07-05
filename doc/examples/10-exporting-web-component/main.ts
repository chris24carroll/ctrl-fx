import { defineWebComponent } from 'ctrl-fx/webcomponent'
import { counter } from './component'

defineWebComponent('ctrl-counter', counter, {
  events: () => 'count-changed',
})
