import { ValidatorError } from './ValidatorError';
import { isString } from '../../helpers';
import { Rule } from '../types';

export function StringValidator() {
  const baseRuleName = 'string';
  const baseRuleExpect = `value to be typeof string`;
  const baseRuleValidate: Rule<string>['validate'] = value => {
    const result = value;
    if (!isString(result)) {
      throw new ValidatorError({ value, expect: baseRuleExpect });
    }
    return result;
  };
  const baseRule = {
    name: baseRuleName,
    expect: baseRuleExpect,
    validate: baseRuleValidate
  };
  const rules = new Map<string, Rule<string>>([[baseRule.name, baseRule]]);
  function executeRules(value: any) {
    return [...rules.values()].reduce((acc, rule) => {
      return rule.validate(acc);
    }, value);
  }

  function addRule<T extends string>(rule: Rule<T>) {
    if (rules.has(rule.name)) throw new Error(`Rule ${rule.name} has already been used`);
    rules.set(rule.name, rule);
  }

  function createRegexRule(name: string, expect: string, regex: RegExp): Rule<string> {
    const validate: Rule<string>['validate'] = value => {
      if (!regex.test(value)) {
        throw new ValidatorError({ value, expect });
      }
      return value;
    };
    return { name, expect, validate };
  }

  const api = {
    min: (val: number) => {
      const name = 'min';
      const expect = `value to be greater or equal than ${val}`;
      const validate: Rule<string>['validate'] = value => {
        if (value.length < val) {
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
        if (value.length > val) {
          throw new ValidatorError({ value, expect });
        }
        return value;
      };

      addRule({ name, expect, validate });
      return Object.assign(executeRules, api);
    },
    size: (val: number) => {
      const name = 'length';
      const expect = `value to be length of ${val}`;
      const validate: Rule<string>['validate'] = value => {
        if (value.length !== val) {
          throw new ValidatorError({ value, expect });
        }
        return value;
      };

      addRule({ name, expect, validate });
      return Object.assign(executeRules, api);
    },
    regex: (regex: RegExp) => {
      const rule = createRegexRule('regex', `value to match pattern: ${regex}`, regex);
      addRule(rule);
      return Object.assign(executeRules, api);
    },
    alphanum: () => {
      const rule = createRegexRule('regex', `value to contain only alphanumeric characters`, /^[a-z0-9]+$/i);
      addRule(rule);
      return Object.assign(executeRules, api);
    }
  };
  return Object.assign(executeRules, api);
}
