import { ValidatorError } from './ValidatorError';
import { Rule } from '../types';

export function BooleanValidator() {
  const baseRuleName = 'boolean';
  const baseRuleExpect = 'value to be typeof boolean';
  const baseRuleValidate: Rule<string>['validate'] = value => {
    if (typeof value === 'boolean') {
      return value;
    } else if (/true/i.test(value)) {
      return true;
    } else if (/false/i.test(value)) {
      return false;
    } else {
      throw new ValidatorError({ value, expect: baseRuleExpect });
    }
  };
  const baseRule = {
    name: baseRuleName,
    expect: baseRuleExpect,
    validate: baseRuleValidate
  };
  const rules = new Map<string, Rule<boolean>>([[baseRule.name, baseRule]]);
  function executeRules(value: any) {
    return [...rules.values()].reduce((acc, rule) => {
      return rule.validate(acc);
    }, value);
  }
  function addRule<T extends boolean>(rule: Rule<T>) {
    if (rules.has(rule.name)) throw new Error(`Rule ${rule.name} has already been used`);
    rules.set(rule.name, rule);
  }
  const api = {};
  return Object.assign(executeRules, api);
}
