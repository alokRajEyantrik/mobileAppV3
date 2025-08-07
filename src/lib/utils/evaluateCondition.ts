function normalizeKey(key: string): string {
    // snake_case → camelCase
    return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

export function evaluateCondition(condition: any, data: Record<string, any>): boolean {
    if (typeof condition !== 'object') return false;

    const operator = Object.keys(condition)[0];
    const operands = condition[operator];

    const resolve = (v: any) =>
        typeof v === 'object' && v.var
            ? data[normalizeKey(v.var)] ?? null
            : v;

    switch (operator) {
        case '==': return resolve(operands[0]) === resolve(operands[1]);
        case 'in': return Array.isArray(operands[1]) && operands[1].includes(resolve(operands[0]));
        case 'and': return operands.every((c: any) => evaluateCondition(c, data));
        case 'or': return operands.some((c: any) => evaluateCondition(c, data));
        default: return true;
    }
}
