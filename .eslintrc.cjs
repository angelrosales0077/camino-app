module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    es2022: true,
    node: true,
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '.expo/',
    '.turbo/',
    'coverage/',
    '*.config.js',
    '*.config.cjs',
  ],
}
