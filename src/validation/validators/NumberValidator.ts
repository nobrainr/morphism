import { ValidatorError } from './ValidatorError';
import { Rule } from '../types';

export function NumberValidator() {
  const baseRuleName = 'number';
  const baseRuleExpect = 'value to be typeof number';
  const baseRuleValidate: Rule<string>['validate'] = value => {
    const result = +value;
    if (isNaN(result)) {
      throw new ValidatorError({ value, expect: baseRuleExpect });
    } else {
      return result;
    }
  };
  const baseRule = {
    name: baseRuleName,
    expect: baseRuleExpect,
    validate: baseRuleValidate
  };
  const rules = new Map<string, Rule<number>>([[baseRule.name, baseRule]]);
  function executeRules(value: any) {
    return [...rules.values()].reduce((acc, rule) => {
      return rule.validate(acc);
    }, value);
  }
  function addRule<T extends boolean>(rule: Rule<T>) {
    if (rules.has(rule.name)) throw new Error(`Rule ${rule.name} has already been used`);
    rules.set(rule.name, rule);
  }
  const api = {
    min: (val: number) => {
      const name = 'min';
      const expect = `value to be greater or equal than ${val}`;
      const validate: Rule<string>['validate'] = value => {
        if (value < val) {
          throw new ValidatorError({ value, expect });
        }
        return value;
      };

      addRule({ name, expect, validate });
      return Object.assign(executeRules, api);
    },
    max: (val: number) => {
      const name = 'max';
      const expect = `value to be less or equal than ${val}`;
      const validate: Rule<string>['validate'] = value => {
        if (value > val) {
          throw new ValidatorError({ value, expect });
        }
        return value;
      };

      addRule({ name, expect, validate });
      return Object.assign(executeRules, api);
    }
  };
  return Object.assign(executeRules, api);
}
