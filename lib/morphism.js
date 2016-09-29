import * as _ from 'lodash';
export function Morphism(schema, items) {
    let _schema = _.clone(schema);
    let transformer = (items) => {
        return _.chain(items)
            .map((obj) => {
                return _.mapValues(_schema, (predicate) => {
                    if (!_.isObject(predicate)) { // a predicate string path
                        return _.get(obj, predicate);
                    }
                    else if (_.isFunction(predicate)) { // a predicate function without a path
                        return predicate(obj);
                    }
                    else if(_.isArray(predicate)){ // a predicate array of string path => agregator
                        return _.reduce(predicate, (delta, path) =>{
                            return _.set(delta, path, _.get(obj, path));
                        },{});
                    }
                    else { // a predicate object with a path and a function
                        let delta = _.get(obj, predicate.path);
                        return predicate.fn(delta);
                    }
                });
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


