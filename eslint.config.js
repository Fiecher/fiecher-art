import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  svelte: true,
  ignores: [
    '**/*.md',
  ],
  rules: {
    'eol-last': ['error', 'always'],
    'style/operator-linebreak': ['warn', 'after'],
    'unicorn/prefer-node-protocol': 'off',
    'no-unused-vars': 'warn',
    'prefer-const': 'error',
    'no-console': 'off',
    'jsonc/sort-keys': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
    'unused-imports/no-unused-imports': 'warn',
    'perfectionist/sort-imports': ['error', {
      groups: [
        'builtin',
        'external',
        'internal',
        ['parent', 'sibling', 'index'],
        'type',
        'side-effect',
      ],
      newlinesBetween: 'ignore',
      order: 'asc',
      type: 'natural',
    }],
  },
  stylistic: {
    overrides: {
      'style/brace-style': ['warn', '1tbs'],
      'style/arrow-parens': 'off',
    },
  },
})
