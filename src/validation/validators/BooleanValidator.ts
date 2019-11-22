import { ValidatorError } from './ValidatorError';
import { isFunction, isString } from '../../helpers';
import { ValidatorOptions, Rule } from './types';
import { LinkedList } from './LinkedList';
import { ValidatorValidateResult, ValidateFunction } from '../../types';

export function BooleanValidator(options: ValidatorOptions = {}) {
  let list = new LinkedList<Rule<boolean>>({
    name: 'boolean',
    expect: input => `Expected value to be a <boolean> but received <${input.value}>`,
    validate: input => {
      if (!options.convert) {
        return typeof input.value === 'boolean';
      } else {
        if (typeof input.value === 'boolean') {
          return input.value;
        } else {
          if (/true/i.test(input.value)) {
            input.value = true;
            return true;
          } else if (/false/i.test(input.value)) {
            input.value = false;
            return true;
          } else {
            return false;
          }
        }
      }
    },
  });

  const validate: ValidateFunction = input => {
    const result: ValidatorValidateResult = input;
    const iterator = list.values();
    let current = iterator.next();
    const usedRules: { [id: string]: Rule<boolean> } = {};

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

  const rules = {};
  const api = Object.assign(validate, rules);
  return api;
}
