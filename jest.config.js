module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 20000,
  setupFiles: ['<rootDir>/tests/setupEnv.js'],
};
