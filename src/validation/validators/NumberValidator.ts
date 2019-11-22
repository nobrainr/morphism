import { ValidatorValidateResult, ValidateFunction } from '../../types';
import { LinkedList } from './LinkedList';
import { ValidatorOptions, Rule } from './types';
import { ValidatorError } from './ValidatorError';
import { isString } from '../../helpers';

export function NumberValidator(options: ValidatorOptions = {}) {
  let list = new LinkedList<Rule<number>>({
    name: 'number',
    expect: input => `Expected value to be a <number> but received <${input.value}>`,
    validate: input => {
      if (!options.convert) {
        return typeof input.value === 'number';
      } else {
        input.value = +input.value;
        return !isNaN(input.value);
      }
    },
  });

  const validate: ValidateFunction = input => {
    const result: ValidatorValidateResult = input;
    const iterator = list.values();
    let current = iterator.next();
    const usedRules: { [id: string]: Rule<number> } = {};

    while (!result.error && !current.done) {
      const rule = current.value;
      if (rule.name in usedRules) {
        throw new Error(`Rule ${rule.name} has already been used`);
      } else {
        usedRules[rule.name] = rule;
      }
      if (!rule.validate(result)) {
        result.error = new ValidatorError({
          expect: isString(rule.expect) ? rule.expect : rule.expect(result),
          value: result.value,
        });
      }
      current = iterator.next();
    }
    return result;
  };

  const rules = {
    min: (value: any) => {
      list.append({
        name: 'min',
        expect: `value to be greater or equal than ${value}`,
        validate: input => input.value >= value,
      });
      return api;
    },
    max: (value: any) => {
      list.append({
        name: 'max',
        expect: `value to be less or equal than ${value}`,
        validate: input => input.value <= value,
      });
      return api;
    },
  };
  const api = Object.assign(validate, rules);
  return api;
}
