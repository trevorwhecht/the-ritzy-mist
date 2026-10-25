/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/src/lib/**/*.test.ts',
    '<rootDir>/src/services/**/*.test.ts',
    '<rootDir>/src/models/**/*.test.ts',
    '<rootDir>/src/app/**/*.test.ts',
  ],
  testPathIgnorePatterns: ['/node_modules/'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'CommonJS', moduleResolution: 'node' } }],
  },
}
