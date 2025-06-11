// mocks/chart.js
const Chart = jest.fn((ctx, config) => ({
  ctx,
  config,
  data: config.data,
  options: config.options,
  update: jest.fn(),
  destroy: jest.fn(),
}));
module.exports = Chart;