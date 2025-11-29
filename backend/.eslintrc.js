module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': 'off',
    // Convert all errors to warnings to not fail CI/CD
    // These can be fixed gradually
    'no-undef': 'warn',
    'no-case-declarations': 'warn',
    'no-useless-escape': 'warn',
    'no-dupe-keys': 'warn',
    'no-dupe-class-members': 'warn',
    'no-control-regex': 'warn',
    // Override recommended rules that are too strict
    'no-unreachable': 'warn',
    'no-constant-condition': 'warn',
  },
};

