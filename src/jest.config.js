/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src/tests"],
  testMatch: ["**/*.test.ts"],
 
  moduleFileExtensions: ["ts", "js", "json"],
  transform: {
    "^.+\\.ts$": "ts-jest"
  },
  verbose: true,
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^\\./services/NameService$": "<rootDir>/src/services/NameService.ts",
  },
  globalSetup: "<rootDir>/src/jest.global-setup.ts",
  globalTeardown: "<rootDir>/src/jest.global-teardown.ts",
  // 👇 Coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.{ts,js}",   // tot el codi
    "!src/tests/**",      // exclou els tests
    "!**/node_modules/**"
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],

  // 👇 Llindars mínims de cobertura
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 90,
      statements: 90
    }
  }
};
