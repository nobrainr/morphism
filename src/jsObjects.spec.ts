import Morphism from './morphism';

describe('Morphism', () => {
  describe('Javascript Objects', () => {
    it('should morph an empty Object to an empty Object || m({}, {}) => {}', function() {
      expect(Morphism({}, {})).toEqual({});
    });

    it('should allow to use a mapper as an iteratee first function', function() {
      let mocks = [{ source: 'value' }, { source: 'value' }, { source: 'value' }];
      let schema = {
        target: 'source'
      };
      const mapper = Morphism(schema);

      let results = mocks.map(mapper);
      results.forEach(res => {
        expect(res).toEqual({ target: 'value' });
      });
    });

    it('should allow to use a mapper declaration as an iteratee first function', function() {
      let mocks = [{ source: 'value' }, { source: 'value' }, { source: 'value' }];
      let schema = {
        target: 'source'
      };

      let results = mocks.map(Morphism(schema));
      results.forEach(res => {
        expect(res).toEqual({ target: 'value' });
      });
    });
  });
});
