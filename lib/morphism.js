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

/**
 * Morphism curried function.
 * @param  {Map<string, any>} schema
 * @param  {} items
 * @param  {} type
 */
export default function Morphism(schema, items, type) {

    const transformItems = customizer => input => {
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
    if (items === undefined && type === undefined) {
        return transformItems(null);
    } else if (type) {

        return (input) => {
            const customizer = data => {
                const undefinedValueCheck = (destination, source) => {
                    if (_.isUndefined(source)) return destination;
                };
                return _.assignInWith(new type(), data, undefinedValueCheck);
            };
            return transformItems(customizer)(input);
        };
    }
    else {
        return transformItems(null)(items);
    }
}

function factory(type, schema, items) {
    let typeFields = _.keys(new type());
    let defaultSchema = _.zipObject(typeFields, typeFields);
    let finalSchema = _.assign(defaultSchema, schema);

    return Morphism(finalSchema, items, type);
}

_.memoize.Cache = WeakMap;
const _registry = _.memoize(factory);

class _Morphism {
    /**
     * Register a mapper for a specific type against morphism
     *
     * @param {any} type
     * @param {any} schema
     */
    static register(type, schema) {
        if (!type && !schema) {
            throw new Error('type paramater is required when register a mapping');
        } else if (_Morphism.exists(type)) {
            throw new Error(`A mapper for ${type.name} has already been registered`);
        }
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

let api = {
    register: _Morphism.register,
    map: _Morphism.map,
    getMapper: _Morphism.getMapper,
    setMapper: _Morphism.setMapper,
    deleteMapper: _Morphism.deleteMapper,
    mappers: _Morphism.mappers
};

_.assignIn(Morphism, api);

