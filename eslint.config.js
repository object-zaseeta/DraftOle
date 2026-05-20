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
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
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
  {
    files: [
      'src/{view,app,publisher,runtime,document,transformer,css,js,utils}/**/*.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/html/elements/_internal/**'],
              message:
                '_internal/ は html/elements 外部からの import を禁止しています（html-tag-responsibility-split spec）。',
            },
          ],
        },
      ],
    },
  },
  {
    // B4-ex: examples 用 strict ブロック。
    // ユーザ向けサンプル（examples/**/*.ts）では `as unknown as X` 二段キャストを禁止する（@deprecated）。
    // DSL 使用コードに cast の影を残さず、型を正しく推論させるためのユーザ向け厳格性を維持する。
    // src/ ではブランド型生成（global-css.ts 等）のために必要箇所が残るため対象外。
    files: ['examples/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSAsExpression > TSAsExpression > TSUnknownKeyword',
          message:
            '`as unknown as X` 二段キャストは禁止です（@deprecated）。ユーザ向けサンプルでは cast を露出させず、型を正しく推論してください。',
        },
      ],
    },
  },
  {
    // B4-ts: tests 用 relaxed ブロック。
    // 緩和の射程: DOM `Element` / TypeScript Compiler API（`ts.Type`, `ts.TypeChecker`, `ts.Symbol` 等）
    // など外部巨大インタフェースに対する構造的モック用途に限定する。
    // DSL 使用コードや本番ロジックでの逃げの cast を肯定するものではない（自主規律の対象）。
    // 将来 jsdom / 実 `ts.Program` ベースへ移行する場合は本ブロックを撤去する方針。
    files: ['tests/**/*.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    files: ['tests/**/fixtures/**/*.js'],
    languageOptions: {
      globals: {
        document: 'readonly',
        console: 'readonly',
        process: 'readonly',
        require: 'readonly',
        exports: 'writable',
        module: 'writable',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  prettierConfig,
  {
    ignores: [
      'dist/',
      'node_modules/',
      'tests/**/__snapshots__/**',
      '.out/',
    ],
  },
];
