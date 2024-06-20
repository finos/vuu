export type SettingsProperty <T extends string | number | boolean | object = string> = {
    name: string;
    label: string;
    values?: T[];
    defaultValue?: T[];
    type: 'string' | 'boolean' | 'number';
}

export interface SettingsSchema {
    properties: SettingsProperty[];
}

