import { ValidatorError } from './ValidatorError';
import { isString } from '../../helpers';
import { ValidatorValidateResult, ValidateFunction } from '../../types';
import { ValidatorOptions, Rule } from './types';
import { LinkedList } from './LinkedList';

export function StringValidator(options: ValidatorOptions = {}) {
  let list = new LinkedList<Rule<string>>({
    name: 'string',
    expect: input => `Expected value to be a <string> but received <${input.value}>`,
    validate: input => {
      if (isString(input.value)) {
        return true;
      } else {
        if (options.convert) {
          input.value = String(input.value);
          return true;
        } else {
          return false;
        }
      }
    },
  });

  const validate: ValidateFunction = input => {
    const result: ValidatorValidateResult = input;
    const iterator = list.values();
    let current = iterator.next();
    const usedRules: { [id: string]: Rule<string> } = {};

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
    min: (value: number) => {
      list.append({
        name: 'min',
        expect: input => `Expected value to be greater or equal than <${value}> but received <${input.value}>`,
        validate: input => input.value.length >= value,
      });
      return api;
    },
    max: (value: number) => {
      list.append({
        name: 'max',
        expect: input => `Expected value to be less or equal than <${value}> but received <${input.value}>`,
        validate: input => input.value.length <= value,
      });
      return api;
    },
    size: (value: number) => {
      list.append({
        name: 'length',
        expect: input => `Expected value to be length of <${value}> but received <${input.value}>`,
        validate: input => input.value.length === value,
      });
      return api;
    },
    regex: (regex: RegExp) => {
      const rule = createRegexRule('regex', input => `Expected value to match pattern: ${regex} but received <${input.value}>`, regex);
      list.append(rule);
      return api;
    },
    alphanum: () => {
      const rule = createRegexRule(
        'regex',
        input => `Expected value to contain only alphanumeric characters but received <${input.value}>`,
        /^[a-z0-9]+$/i
      );
      list.append(rule);
      return api;
    },
  };
  const api = Object.assign(validate, rules);
  return api;
}

function createRegexRule(name: Rule['name'], expect: Rule['expect'], regex: RegExp): Rule<string> {
  const validate: Rule<string>['validate'] = input => regex.test(input.value);
  return { name, expect, validate };
}
