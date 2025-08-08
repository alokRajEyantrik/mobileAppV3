function normalizeKey(key: string): string {
    // First remove any prefix like q1_, q2_ etc
    const withoutPrefix = key.replace(/^q\d+_/, '');
    // Then convert snake_case → camelCase
    return withoutPrefix.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function resolveValue(key: string, data: Record<string, any>): any {
    // Try all possible key formats
    const possibleKeys = [
        key,                    // Original key
        normalizeKey(key),     // Normalized key
        `q1_${key}`,           // With q1_ prefix
        `q2_${key}`,           // With q2_ prefix
        key.split('_').pop()   // Just the last part after _
    ];

    for (const k of possibleKeys) {
        if (k && data[k] !== undefined) {
            console.log(`Found value for ${key} using key ${k}:`, data[k]);
            return data[k];
        }
    }
    
    console.log(`No value found for ${key} in:`, Object.keys(data));
    return null;
}

export function evaluateCondition(condition: any, data: Record<string, any>): boolean {
    if (typeof condition !== 'object') return false;

    const operator = Object.keys(condition)[0];
    const operands = condition[operator];

    const resolve = (v: any) =>
        typeof v === 'object' && v.var
            ? resolveValue(v.var, data)
            : v;

    switch (operator) {
        case '==': return resolve(operands[0]) === resolve(operands[1]);
        case 'in': return Array.isArray(operands[1]) && operands[1].includes(resolve(operands[0]));
        case 'and': return operands.every((c: any) => evaluateCondition(c, data));
        case 'or': return operands.some((c: any) => evaluateCondition(c, data));
        default: return true;
    }
}
