module.exports = {
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}'],
  coverageReporters: ['json', 'lcov', 'text'],
  verbose: true,
  coverageThreshold: {
    global: {
      statements: 96,
      branches: 90,
      functions: 100,
      lines: 96
    }
  }
};
