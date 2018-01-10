import Morphism from './morphism';

class Target {
    property: string;
}
export default class Main {
    constructor() {
        console.log('Typescript Webpack starter launched');
        const results = Morphism(
            { property: 'sourceProperty'},
            { sourceProperty: ' a value'},
            Target);

        console.log('Debug:::', JSON.stringify(results, null, 4));
    }
}

let start = new Main();


