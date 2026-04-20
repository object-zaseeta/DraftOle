import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
    },
  },
  {
    files: ['src/html/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/css/manager/*',
                '**/js/jquery-manager*',
                '**/js/jquery-helper*',
              ],
              message:
                'html/ および protocols/ から css/ または js/ の具象実装を import することは禁止です。composition-root.ts を経由してください。',
            },
          ],
        },
      ],
    },
  },
  prettierConfig,
  {
    ignores: ['dist/', 'node_modules/'],
  },
];
