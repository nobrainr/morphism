import * as _ from 'lodash';

export default function Morphism(schema, items) {
    let _schema = _.clone(schema);
    let transformer = (items) => {
        return _.chain(items)
            .map((obj) => {
                let transformedObject = _.mapValues(_schema, (predicate) => {
                    if (!_.isObject(predicate)) { // a predicate string path
                        return _.get(obj, predicate);
                    }
                    else if (_.isFunction(predicate)) { // a predicate function without a path
                        return predicate(obj);
                    }
                    else if (_.isArray(predicate)) { // a predicate array of string path => agregator
                        return _.reduce(predicate, (delta, path) => {
                            return _.set(delta, path, _.get(obj, path));
                        }, {});
                    }
                    else { // a predicate object with a path and a function
                        let delta = _.get(obj, predicate.path);
                        return predicate.fn(delta);
                    }
                });


                return transformedObject;



            }).value();
    };

    if (items === undefined) {
        return (items) => {
            return transformer(items);
        };
    } else {
        return transformer(items);
    }

}


function factory(type, schema, items) {
    let typeFields = _.keys(new type());
    let defaultSchema = _.zipObject(typeFields,typeFields);
    let finalSchema = _.assign(defaultSchema,schema);

    return Morphism(finalSchema, items);
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
            throw new Error('When using register, you must provide at least a [Type] or a mapping [configuration]');
        }
        return _registry(type, schema); // Store the result of the executed function in a WeakMap cache object
    }

    static map(type, data) {
        let results = _registry(type)(data);
        let assign = function (type) { return _.assignIn(new type, this); };
        return _.invokeMap(results, assign, type);
    }

    static getMapper(type) {
        return _registry.cache.get(type);
    }


}

let api = {
    register: _Morphism.register,
    map: _Morphism.map,
    getMapper: _Morphism.getMapper
};

_.assignIn(Morphism, api);

