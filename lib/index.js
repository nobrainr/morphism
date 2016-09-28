import * as _ from 'lodash';
export function Morphism(schema, items) {
    let _schema = _.clone(schema);
    let transformer = (items) => {
        return _.chain(items)
            .map((obj) => {
                return _.mapValues(_schema, (transformation) => {
                    if (!_.isObject(transformation)) {
                        return _.get(obj, transformation);
                    }
                    else if (_.isFunction(transformation)) {
                        let delta = _.get(obj, transformation.path);
                        return transformation(delta);
                    }
                    else {
                        let delta = _.get(obj, transformation.path);
                        return transformation.fn(delta);
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
