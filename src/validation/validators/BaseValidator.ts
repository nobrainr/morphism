interface Rule<T> {
  name: string;
  test: (value: T) => T;
}

export abstract class BaseValidator<T = unknown> {
  protected rules = new Map<string, Rule<T>>();
  constructor(rule: Rule<T>) {
    this.addRule(rule);
  }
  protected addRule(rule: Rule<T>) {
    if (this.rules.has(rule.name)) throw new Error(`Rule ${rule.name} has already been used`);
    this.rules.set(rule.name, rule);
  }
  validate(value: T) {
    return [...this.rules.values()].reduce((acc, rule) => {
      return rule.test(acc);
    }, value);
  }
}
