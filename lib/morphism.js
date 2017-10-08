import * as _ from 'lodash';

function transformValuesFromObject(object, schema, items){ // Low Level transformer function (without type consideration)
    const _schema = _.clone(schema);

    return _.mapValues(_schema, (predicate, targetProperty) => { // iterate on every predicate of the schema
        if (!_.isObject(predicate)) { // a predicate string path: [ desintation: 'source' ]
            return _.get(object, predicate);
        }
        else if (_.isFunction(predicate)) { // a predicate function without a path: [ destination: (object) => {...} ]
            return predicate(object, items);
        }
        else if (_.isArray(predicate)) { // a predicate array of string path => agregator: [ destination: ['source1', 'source2', 'source3'] ]
            return _.reduce(predicate, (delta, path) => {
                return _.set(delta, path, _.get(object, path));
            }, {});
        }
        else { // a predicate object with a path and a function: [ destination : { path: 'source', fn:(fieldValue, items) }]
            let delta = _.get(object, predicate.path);
            let result;
            try{
                result = predicate.fn.call(undefined, delta, object, items);
            }catch(e){
                e.message = `Unable to set target property [${targetProperty}].`
                +`\n    An error occured when applying [${predicate.fn.name}] on property [${predicate.path}]`
                +`\n    Internal error: ${e.message}`;
                throw(e);
            }

            return result;
        }
    });
}

export default function Morphism(schema, items, type) {

    const transformItems = (input, customizer) => {
        if(_.isUndefined(input)){
            return _.noop();
        }
        if(_.isArray(input) && input.length === 0){
            return [];
        }else if(_.isObject(input) && _.isEmpty(input)){
            return {};
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
        return transformItems;
    } else if (type) {

        return (input) => {
            const customizer = data => {
                const undefinedValueCheck = (destination, source) => {
                    if (_.isUndefined(source)) return destination;
                };
                return _.assignInWith(new type(), data, undefinedValueCheck);
            };
            return transformItems(input,customizer);
        };
    }
    else {
        return transformItems(items);
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

    static map(type, data) {
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

