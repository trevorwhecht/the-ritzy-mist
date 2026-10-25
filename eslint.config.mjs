// Next 16 removed the `next lint` command, so ESLint is invoked directly and needs its own
// flat config. eslint-config-next ships flat-config arrays under these subpath exports.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

export default [
  { ignores: ['.next/**', 'node_modules/**', 'out/**', 'build/**', 'next-env.d.ts'] },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // `const { password: _pw, ...safe } = user` is how route handlers strip private fields
      // before responding. The binding is intentionally unused — that IS the point.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
]
