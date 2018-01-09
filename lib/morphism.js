import * as _ from 'lodash';

const aggregator = (paths, object) => {
    return _.reduce(paths, (delta, path) => {
        return _.set(delta, path, _.get(object, path));
    }, {});
};
/**
 * Low Level transformer function (without type consideration).
 * Take a plain object as input and transform its values using a specified schema.
 * @param  {Object} object
 * @param  {Map<string, string> | Map<string, Function>} schema Transformation schema
 * @param  {Array} items Items to be forwarded to Actions
 */
function transformValuesFromObject(object, schema, items){
    const _schema = _.clone(schema);

    return _.mapValues(_schema, (action, targetProperty) => { // iterate on every action of the schema
        if (_.isString(action)) { // Action<String>: string path => [ target: 'source' ]
            return _.get(object, action);
        }
        else if (_.isFunction(action)) { // Action<Function>: Free Computin - a callback called with the current object and collection [ destination: (object) => {...} ]
            return action.call(undefined, object, items);
        }
        else if (_.isArray(action)) { // Action<Array>: Aggregator - string paths => : [ destination: ['source1', 'source2', 'source3'] ]
            return aggregator (action, object);
        }
        else if(_.isObject(action)){ // Action<Object>: a path and a function: [ destination : { path: 'source', fn:(fieldValue, items) }]
            let value;
            if(_.isArray(action.path)){
                value = aggregator(action.path, object);
            }else if(_.isString(action.path)){
                value = _.get(object, action.path);
            }
            let result;
            try{
                result = action.fn.call(undefined, value, object, items);
            }catch(e){
                e.message = `Unable to set target property [${targetProperty}].`
                +`\n    An error occured when applying [${action.fn.name}] on property [${action.path}]`
                +`\n    Internal error: ${e.message}`;
                throw(e);
            }

            return result;
        }
    });
}

const transformItems = (schema, customizer) => input => {
    if(!input){
        return input;
    }
    if (_.isArray(input)){
        return input.map(obj =>  {
            if(customizer){
                return customizer(transformValuesFromObject(obj, schema, input));
            }else{
                return transformValuesFromObject(obj, schema, input);
            }
        });
    }else{
        const object = input;
        if(customizer){
            return customizer(transformValuesFromObject(object, schema, [object]));
        }else{
            return transformValuesFromObject(object, schema, [object]);
        }
    }

};
/**
 * Object Literals Mapper (Curried Function)
 * Only gives a Schema as parameter will output a mapper function to pass items to.
 * Pass a Schema and items to map the input straight away.
 *
 * @param  {Map<string, any>} schema Configuration schema to compute data source properties
 * @param  {} items Object or Collection to be mapped
 * @param  {} type
 * @example
 *
 * const mapper = Morphism(schema);
 *
 * // => Map a single Object
 *
 * const mappedObject= mapper(sourceObject);
 *
 * // => Map a collection of Objects
 *
 * const mappedObjects = collectionOfObjects.map(mapper);
 *
 * // => Map everything straight away
 *
 *  const output = Morphism(schema, input);
 */
export function Morphism(schema, items, type) {
    const customizer = data => {
        const undefinedValueCheck = (destination, source) => {
            if (_.isUndefined(source)) return destination;
        };
        return _.assignInWith(new type(), data, undefinedValueCheck);
    };
    if (items === undefined && type === undefined) {
        return transformItems(schema, null);
    } else if(schema && items && type) {
        return transformItems(schema, customizer)(items);
    } else if(schema && items) {
        return transformItems(schema, null)(items);
    }else if(type && items){
        let finalSchema = getSchemaForType(type, schema);
        return transformItems(finalSchema, customizer)(items);
    }else if(type){
        let finalSchema = getSchemaForType(type, schema);
        return (futureInput) => {
            return transformItems(finalSchema, customizer)(futureInput);
        };
    }
}

const getSchemaForType = (type, baseSchema) => {
    let typeFields = _.keys(new type());
    let defaultSchema = _.zipObject(typeFields, typeFields);
    let finalSchema = _.assign(defaultSchema, baseSchema);
    return finalSchema;
};
/**
 * Type Mapper Factory
 * @param {type} type Class Type to be registered
 * @param {Object} schema Configuration of how properties are computed from the source
 * @param {Object | Array } items Object or Collection to be mapped
 */
function factory(type, schema, items) {
    let finalSchema = getSchemaForType(type, schema);

    return Morphism(finalSchema, items, type);
}

_.memoize.Cache = WeakMap;
const _registry = _.memoize(factory);

class _Morphism {
    /**
     * Register a mapping schema for a Type aimed to be used later
     *
     * @param {Type} type Class Type to be registered
     * @param {Object} schema Configuration of how properties are computed from the source
        * @param {Object | Array } items Object or Collection to be mapped
     * @returns {Function<T>} Mapper function to be used against a data source
     */
    static register(type, schema) {
        if (!type && !schema) {
            throw new Error('type paramater is required when register a mapping');
        } else if (_Morphism.exists(type)) {
            throw new Error(`A mapper for ${type.name} has already been registered`);
        }
        /**
         * @param {Object | Array } items Object or Collection to be mapped
         */
        return _registry(type, schema); // Store the result of the executed function in a WeakMap cache object
    }
    /**
     *
     * @param   {Type} type
     * @param   {Array|Object} data
     * @returns {Array<type>|Object}
     * @example
     *
     * let collectionOfType = Morphism.map(Type, [object1, object2, object3]);
     */
    static map(type, data) {
        if(!_Morphism.exists(type)){
            const mapper = _Morphism.register(type);
            if(data === undefined){
                return mapper;
            }
        }
        return _registry(type)(data);
    }

    static getMapper(type) {
        return _registry.cache.get(type);
    }

    static get mappers() {
        return _registry.cache;
    }

    static exists(type) {
        return _registry.cache.has(type);
    }

    static setMapper(type, schema) {
        if (!schema) {
            throw new Error(`The schema must be an Object. Found ${schema}`);
        } else if (!_Morphism.exists(type)) {
            throw new Error(`The type ${type.name} is not registered. Register it using \`Mophism.register(${type.name}, schema)\``);
        } else {
            let fn = factory(type, schema);
            _registry.cache.set(type, fn);
            return _registry(type);
        }

    }

    static deleteMapper(type) {
        return _registry.cache.delete(type);
    }
}

/** API */
Morphism.register = _Morphism.register;
Morphism.map = _Morphism.map;
Morphism.getMapper = _Morphism.getMapper;
Morphism.setMapper = _Morphism.setMapper;
Morphism.deleteMapper = _Morphism.deleteMapper;
Morphism.mappers = _Morphism.mappers;
/** API */

export default Morphism;
