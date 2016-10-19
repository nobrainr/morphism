import * as _ from 'lodash';
export default function Morphism(schema, items) {
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
            }).value();
    };

    // var  schema1  =  {  'a':  'b',  'c':  'd'  };
    // var  schema2  =  {  'e': 'f',  'g':  'h'  };

    // var d1 = { b: 2, d: 4 };
    // var d2 = { e: 5, g: 8 };



    // class User { constructor(a, c) { this.a = a; this.c = c } };


    // // Replace `_.memoize.Cache`.
    // _.memoize.Cache  =  WeakMap;

    // let factory = (model, schema) => {
    //     console.log('model', model);
    //     if (schema.a) {
    //         return (data) => {
    //             console.log('schema a', data);
    //         }
    //     }
    //     else {
    //         return (data) => {
    //             console.log('schema b', data);
    //         }

    //     }
    // };

    // let resolver = (arg, arg2) => { console.log('resolver', arg, arg2); return arg; };

    // var  registry  =  _.memoize(factory, resolver);



    // let m1 = registry(User, schema1);
    // //let m2 = registry(schema2);





    // console.log('result', m1(d1))

    if (items === undefined) {
        return (items) => {
            return transformer(items);
        };
    } else {
        return transformer(items);
    }




}
