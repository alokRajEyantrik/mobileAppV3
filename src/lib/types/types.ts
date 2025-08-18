export interface Question {
    id: string;
    type:
    | 'text'
    | 'radio'
    | 'select'
    | 'checkbox'
    | 'textarea'
    | 'date'
    | 'number'
    | 'derivedSelect'
    | 'multiple-select';
    question: string;
    description?: string;
    bindsTo?: string;
    bindsTo_template?: string;
    contextKey?: string;
    options?: Array<{
        label: string | { var: string };
        value: string | { var: string } | number | boolean;
    }>;
    required?: boolean;
    showWhen?: any; // JSON Logic expression
    validation?: { condition: any; message: string };
    errorMessage?: Record<string, string>;
    uiMeta?: {
        readonly?: boolean;
        placeholder?: string | string[];
        rows?: number;
        min?: string | number;
        max?: string | number;
        step?: number | 'any';
    };
}

export interface Page {
    questions: Question[];
    title?: string;
    showWhen?: any;
    nextButtonVisibility?: { mode: string[] };
}

export interface Schema {
    pages: Page[];
}

export interface Answers {
    [key: string]: string | number | boolean | (string | number)[] | undefined;
    loanName?: string;
}

export interface LoanDataStore {
    [key: string]: Answers | string | undefined;
    loanName?: string;
}