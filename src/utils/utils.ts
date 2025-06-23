import { Parser } from 'expr-eval';
import type { Value } from 'expr-eval';

export function allRequirementsMet(exprs: string[], userTraits: Set<string>): boolean {
  const context: Record<string, Value> = {};
  userTraits.forEach((trait) => (context[trait] = true as unknown as Value));

  try {
    return exprs.every((expr) => {
      const parsed = Parser.parse(expr);
      const vars = parsed.variables();
      const completeContext = Object.fromEntries(vars.map(v => [v, context[v] ?? false]));
      return parsed.evaluate(completeContext);
    });
  } catch (err) {
    console.warn("Error evaluating requirement expression:", err);
    return false;
  }
}