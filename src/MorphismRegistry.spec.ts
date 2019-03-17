import Morphism from './morphism';
import { User, MockData } from './utils-test';

describe('Mappers Registry', function() {
  const dataToCrunch: MockData[] = [
    {
      firstName: 'John',
      lastName: 'Smith',
      age: 25,
      address: {
        streetAddress: '21 2nd Street',
        city: 'New York',
        state: 'NY',
        postalCode: '10021'
      },
      phoneNumber: [
        {
          type: 'home',
          number: '212 555-1234'
        },
        {
          type: 'fax',
          number: '646 555-4567'
        }
      ]
    }
  ];
  beforeEach(() => {
    Morphism.deleteMapper(User);
    Morphism.register(User);
  });
  it('should throw an exception when using Registration function without parameters', function() {
    expect(() => Morphism.register(null as any, null)).toThrow();
  });

  it('should throw an exception when trying to register a mapper type more than once', function() {
    expect(() => {
      Morphism.register(User, {});
    }).toThrow();
  });

  it('should return the stored mapper after a registration', function() {
    let schema = {
      phoneNumber: 'phoneNumber[0].number'
    };
    let mapper = Morphism.setMapper(User, schema);
    let mapperSaved = Morphism.getMapper(User);
    expect(typeof mapper).toEqual('function');
    expect(typeof mapperSaved).toEqual('function');
    expect(mapperSaved).toEqual(mapper);
  });

  it('should get a stored mapper after a registration', function() {
    Morphism.setMapper(User, {});
    expect(typeof Morphism.getMapper(User)).toEqual('function');
  });

  it('should allow to map data using a registered mapper', function() {
    let schema = {
      phoneNumber: 'phoneNumber[0].number'
    };
    Morphism.setMapper(User, schema);
    let desiredResult = new User('John', 'Smith', '212 555-1234');
    expect(Morphism.map(User, dataToCrunch)).toBeTruthy();
    expect(Morphism.map(User, dataToCrunch)[0]).toEqual(desiredResult);
  });

  it('should allow to map data using a mapper updated schema', function() {
    let schema = {
      phoneNumber: 'phoneNumber[0].number'
    };
    let mapper = Morphism.setMapper(User, schema);
    let desiredResult = new User('John', 'Smith', '212 555-1234');
    expect(mapper(dataToCrunch)[0]).toEqual(desiredResult);
  });

  it('should throw an exception when trying to set an non-registered type', function() {
    Morphism.deleteMapper(User);
    expect(() => {
      Morphism.setMapper(User, {});
    }).toThrow();
  });
});
