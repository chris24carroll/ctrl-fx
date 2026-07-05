// import { todo } from "../utils/index.ts"

// export type DownField = { _tag: 'down_field', value: string }
// export type DownArray = { _tag: 'down_array', index: number }
// export type PathElem = DownField | DownArray

// export type Valid<A> = { _tag: 'valid', value: A }

// export type Invalid = { _tag: 'invalid', path: PathElem[], value: any, expectedType: string, reason: string }

// export function fieldToPath(field: string): PathElem[] {
//   return [{
//     _tag: 'down_field',
//     value: field
//   }]
// }

// export type ValidationResult<A> = Valid<A> | Invalid

// export type Validator<A> = (value: any) => ValidationResult<A>

// export type MyType = {
//   readonly a: number
//   readonly b: readonly number[]
//   readonly c?: string
// }

// export function valid<A>(value: A): Valid<A> {
//   return { _tag: 'valid', value }
// }

// export function invalid(path: PathElem[], value: any, expectedType: string, reason: string): Invalid {
//   return { _tag: 'invalid', path, value, expectedType, reason }
// }

// export const intValidator: Validator<number> = (value: any) => {
//   if (Number.isInteger(value)) {
//     return valid(value as number)
//   } else {
//     //return invalid(value)
//   }
//   return todo()
// }

// // export function downField<A>(field: string, validator: Validator<A>) {
// //   (value: any) => {

// //     const valueType = typeof (value)

// //     if (valueType !== 'object') {
// //       return invalid([], value, 'object', `${valueType} is not an object`)
// //     }

// //     if (Array.isArray(value)) {

// //     }

// //   }
// // }

// function downField<A>(field: string, validator: Validator<A>) {
//   return {
//     field,
//     validator
//   }
// }

// function objectValidator<A>(
//   ...fieldValidators: { field: string, validator: Validator<unknown> }[]
// ) {

// }

// function arrayValidator<A>(itemValidator: Validator<A>): Validator<A[]> {
//   return todo()
// }

// function or<L, R>(left: Validator<L>, right: Validator<R>): Validator<L | R> {

//   return todo()
// }

// const stringValidator: Validator<string> = (value: any) => {
//   return todo()
// }

// const undefinedValidator: Validator<undefined> = (value: any) => {
//   return todo()
// }

// /*
// function x(value: any): ValidationResult<MyType> {
//   return objectValidator(
//     downField("a", intValidator),
//     downField("b", arrayValidator(intValidator)),
//     downField("c", or(stringValidator, undefinedValidator))
//   )
// }
//   */

// //export const myTypeValidator: Validator<MyType> = (value: any) {
// //downKey(value, "a", intValidator)
// //}

// /*
// export function obj0(): Validator<{}> {
//   return todo()
// }

// export function field<A extends string>(

// )

// export function obj0<A>(fieldValidator: ): Validator<{}> {
//   return todo()
// }

// export function obj1(value: any): Validator<{}> {
//   return todo()
// }
//   */

export type JsonPrimitive = string | number | boolean | null

export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue }
