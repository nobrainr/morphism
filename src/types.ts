/**
 * A structure-preserving object from a source data towards a target data.
 *
 * The keys of the schema match the desired destination structure.
 * Each value corresponds to an Action applied by Morphism when iterating over the input data
 * @example
 * ```typescript
 *
 * const input = {
 *   foo: {
 *     baz: 'value1'
 *   }
 * };
 *
 * const schema: Schema = {
 *   bar: 'foo', // ActionString
 *   qux: ['foo', 'foo.baz'], // ActionAggregator
 *   quux: (iteratee, source, destination) => { // ActionFunction
 *     return iteratee.foo;
 *   },
 *   corge: { // ActionSelector
 *     path: 'foo.baz',
 *     fn: (propertyValue, source) => {
 *       return propertyValue;
 *     }
 *   }
 * };
 *
 * morphism(schema, input);
 * ```
 */
export type StrictSchema<Target = any, Source = any> = {
  /** `destinationProperty` is the name of the property of the target object you want to produce */
  [destinationProperty in keyof Target]:
    | ActionString<Source>
    | ActionFunction<Target, Source, Target[destinationProperty]>
    | ActionAggregator
    | ActionSelector<Source, Target[destinationProperty]>
    | StrictSchema<Target[destinationProperty], Source>
};
export type Schema<Target = any, Source = any> = {
  /** `destinationProperty` is the name of the property of the target object you want to produce */
  [destinationProperty in keyof Target]?:
    | ActionString<Source>
    | ActionFunction<Target, Source, Target[destinationProperty]>
    | ActionAggregator
    | ActionSelector<Source, Target[destinationProperty]>
    | Schema<Target[destinationProperty], Source>
};

export type Actions<Target, Source> =
  | ActionFunction<Target, Source>
  | ActionAggregator
  | ActionString<Target>
  | ActionSelector<Source>;

/**
 * A Function invoked per iteration
 * @param {} iteratee The current element to transform
 * @param source The source input to transform
 * @param target The current element transformed
 * @example
 * ```typescript
 *
 * const source = {
 *   foo: {
 *     bar: 'bar'
 *   }
 * };
 * let schema = {
 *   bar: iteratee => {
 *     // Apply a function over the source propery
 *     return iteratee.foo.bar;
 *   }
 * };
 *
 * morphism(schema, source);
 * //=> { bar: 'bar' }
 * ```
 *
 */
export interface ActionFunction<D = any, S = any, R = any> {
  (iteratee: S, source: S[], target: D): R;
}

/**
 * A String path that indicates where to find the property in the source input
 *
 * @example
 * ```typescript
 *
 * const source = {
 *   foo: 'baz',
 *   bar: ['bar', 'foo'],
 *   baz: {
 *     qux: 'bazqux'
 *   }
 * };
 * const schema = {
 *   foo: 'foo', // Simple Projection
 *   bazqux: 'baz.qux' // Grab a value from a nested property
 * };
 *
 * morphism(schema, source);
 * //=> { foo: 'baz', bazqux: 'bazqux' }
 * ```
 *
 */
export type ActionString<T> = keyof T;
/**
 * An Array of String that allows to perform a function over source property
 *
 * @example
 * ```typescript
 *
 * const source = {
 *   foo: 'foo',
 *   bar: 'bar'
 * };
 * let schema = {
 *   fooAndBar: ['foo', 'bar'] // Grab these properties into fooAndBar
 * };
 *
 * morphism(schema, source);
 * //=> { fooAndBar: { foo: 'foo', bar: 'bar' } }
 * ```
 */
export type ActionAggregator = string[];
/**
 * An Object that allows to perform a function over a source property's value
 *
 * @example
 * ```typescript
 *
 * const source = {
 *   foo: {
 *     bar: 'bar'
 *   }
 * };
 * let schema = {
 *   barqux: {
 *     path: 'foo.bar',
 *     fn: value => `${value}qux` // Apply a function over the source property's value
 *   }
 * };
 *
 * morphism(schema, source);
 * //=> { barqux: 'barqux' }
 *```
 *
 */
export type ActionSelector<Source = any, R = any> = {
  path: string | string[];
  fn: (fieldValue: any, object: Source, items: Source, objectToCompute: R) => R;
};

export interface Constructable<T> {
  new (...args: any[]): T;
}
