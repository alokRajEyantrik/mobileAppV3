// form-utils.ts

export function resolveVar(input: any, answers: Record<string, any>): any {
  if (typeof input === 'object' && input.var) {
    return answers[input.var];
  }
  return input;
}

export function resolveBindsTo(bindsTo: any, answers: Record<string, any>): string {
  if (typeof bindsTo === 'string') return bindsTo;
  if (bindsTo.concat) {
    return bindsTo.concat.map(part => resolveVar(part, answers)).join('');
  }
  return '';
}

export function evaluateCondition(condition: any, answers: Record<string, any>): boolean {
  if ('in' in condition) {
    const [left, right] = condition.in;
    return right.includes(resolveVar(left, answers));
  }
  if ('==' in condition) {
    const [left, right] = condition['=='];
    return resolveVar(left, answers) === right;
  }
  if ('and' in condition) {
    return condition.and.every((c: any) => evaluateCondition(c, answers));
  }
  if ('or' in condition) {
    return condition.or.some((c: any) => evaluateCondition(c, answers));
  }
  return false;
}

export function isQuestionVisible(question: any, answers: Record<string, any>): boolean {
  if (!question.showWhen) return true;
  return evaluateCondition(question.showWhen, answers);
}

export function buildNestedOutput(pages: any[], answers: Record<string, any>): Record<string, any> {
  const output: Record<string, any> = {};
  pages.forEach(page => {
    page.questions.forEach((q: any) => {
      const value = answers[q.id];
      if (value === undefined) return;

      const path = resolveBindsTo(q.bindsTo, answers);
      const segments = path.split('.');

      let current = output;
      for (let i = 0; i < segments.length - 1; i++) {
        const key = segments[i];
        if (!current[key]) current[key] = {};
        current = current[key];
      }

      current[segments[segments.length - 1]] = value;
    });
  });
  return output;
}
