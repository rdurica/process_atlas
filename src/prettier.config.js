/** @type {import('prettier').Config} */
export default {
    semi: true,
    singleQuote: true,
    trailingComma: 'es5',
    tabWidth: 4,
    useTabs: false,
    printWidth: 100,
    arrowParens: 'avoid',
    endOfLine: 'lf',
    plugins: ['prettier-plugin-tailwindcss'],
    overrides: [
        {
            files: '*.json',
            options: {
                tabWidth: 2,
            },
        },
        {
            files: ['*.ts', '*.tsx'],
            options: {
                parser: 'typescript',
            },
        },
        {
            files: '*.md',
            options: {
                proseWrap: 'preserve',
            },
        },
    ],
};