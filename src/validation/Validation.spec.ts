import { Validation } from "./Validation";
import { createSchema } from "../MorphismTree";
import { morphism, reporter, ValidatorError } from "../morphism";
import { ValidationError, defaultFormatter } from "./reporter";
import { isEmail } from "validator";
import { isFunction, isString } from "../helpers";
import { Rule } from "./validators/types";
import { LinkedList } from "./validators/LinkedList";
import { ValidatorValidateResult, ValidateFunction } from "../types";

declare module "./Validation" {
  interface IValidation {
    test: typeof TestValidator;
  }
}
function TestValidator() {
  let list = new LinkedList<Rule<string[]>>({
    name: "array",
    expect: input =>
      `Expected value to be an <array> but received <${input.value}>`,
    validate: input => Array.isArray(input.value)
  });

  const validate: ValidateFunction = input => {
    const result: ValidatorValidateResult = input;
    const iterator = list.values();
    let current = iterator.next();
    while (!result.error && !current.done) {
      const rule = current.value;
      if (!rule.validate(result)) {
        result.error = new ValidatorError({
          expect: isString(rule.expect) ? rule.expect : rule.expect(result),
          value: result.value
        });
      }
      current = iterator.next();
    }
    return result;
  };

  const rules = {
    max: (value: any) => {
      list.append({
        name: "max",
        expect: input =>
          `Expected length of array to be less or equal than <${value}> but received <${input.value}>`,
        validate: input => input.value <= value
      });
      return api;
    }
  };
  const api = Object.assign(validate, rules);
  return api;
}
Validation.addValidator("test", TestValidator);

describe("Validation", () => {
  it("should allow to add a custom validator", () => {
    interface S {
      s1: string[];
    }
    interface T {
      t1: string[];
    }

    const length = 2;
    const source: S = { s1: ["a", "b", "c"] };
    const schema = createSchema<T, S>({
      t1: { path: "s1", validation: Validation.test().max(length) }
    });

    const result = morphism(schema, source);
    const error = new ValidationError({
      targetProperty: "t1",
      innerError: new ValidatorError({
        expect: `Expected length of array to be less or equal than <${length}> but received <${source.s1}>`,
        value: source.s1
      })
    });
    const message = defaultFormatter(error);

    const errors = reporter.report(result);
    expect(errors).not.toBeNull();
    if (errors) {
      expect(errors.length).toEqual(1);
      expect(errors[0]).toBe(message);
    }
  });

  it("should allow to use validator.js as a third party validation library", () => {
    interface S {
      s1: string;
    }
    interface T {
      t1: string;
    }

    const source: S = { s1: "email@gmail.com" };
    const schema = createSchema<T, S>({
      t1: {
        path: "s1",
        validation: input => {
          if (isEmail(input.value)) {
            return { value: input.value };
          } else {
            return {
              value: input.value,
              error: new ValidatorError({
                value: input.value,
                expect: `Expected value to be an <email> but received <${input.value}>`
              })
            };
          }
        }
      }
    });
    const expected: T = { t1: source.s1 };
    const result = morphism(schema, source);
    expect(result).toEqual(expected);
  });
});
