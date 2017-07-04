import * as _ from 'lodash';

export default function Morphism(schema, items, type) {
    let _schema = _.clone(schema);
    let transformer = (items) => { // Low Level transformer function (without type consideration)
        return _.chain(items)
            .map((obj) => {
                let transformedObject = _.mapValues(_schema, (predicate) => { // iterate on every predicate of the schema
                    if (!_.isObject(predicate)) { // a predicate string path: [ desintation: 'source' ]
                        return _.get(obj, predicate);
                    }
                    else if (_.isFunction(predicate)) { // a predicate function without a path: [ destination: (object) => {...} ]
                        return predicate(obj, items);
                    }
                    else if (_.isArray(predicate)) { // a predicate array of string path => agregator: [ destination: ['source1', 'source2', 'source3'] ]
                        return _.reduce(predicate, (delta, path) => {
                            return _.set(delta, path, _.get(obj, path));
                        }, {});
                    }
                    else { // a predicate object with a path and a function: [ destination : { path: 'source', fn:(fieldValue, items) }]
                        let delta = _.get(obj, predicate.path);
                        return predicate.fn(delta, items);
                    }
                });
                return transformedObject;
            });
    };

    if (items === undefined && type === undefined) {
        return (items) => {
            return transformer(items).value();
        };
    } else if (type) {
        return (items) => {
            const customizer = (destination, source) => {
                if(_.isUndefined(source))
                    return destination;
            };
            return transformer(items).map((o) => _.assignInWith(new type(), o, customizer)).value(); // TODO: Refactor this in a chain of responsibility pattern
        };
    }
    else {
        return transformer(items).value();
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

