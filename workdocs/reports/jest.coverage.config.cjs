const baseConfig = require("../../jest.config.cjs");

const config = {
  ...baseConfig,
  collectCoverage: true,
};

// eslint-disable-next-line no-undef
module.exports = config;
