/**
 * @jest-environment jsdom
 */
global.Chart = require('./mocks/chart'); // Mock Chart.js

// Set up console spies globally to catch all logs
const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

describe('Overview Graph', () => {
  beforeEach(() => {
    // Reset the DOM before each test
    document.body.innerHTML = `
      <div id="tabContent"></div>
      <canvas id="trendChart"></canvas>
      <canvas id="crisisChart2008"></canvas>
      <canvas id="crisisChart2020"></canvas>
      <canvas id="populationCo2Chart"></canvas>
      <span id="currentEmissions">-</span>
      <span id="emissionsChange">-</span>
      <span id="perCapita">-</span>
      <span id="perCapitaChange">-</span>
      <span id="globalShare">-</span>
      <span id="globalRank">-</span>
      <span id="mainSector">-</span>
      <span id="sectorPercentage">-</span>
    `;
    // Mock the fetch API
    global.fetch = jest.fn((url) => {
      if (url.includes('/api/countries')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ countries: ['Slovenia', 'Europe', 'World'] }),
        });
      }
      if (url.includes('/api/emissions?country=Slovenia&metric=co2&startYear=1990')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { year: 1990, value: 15.0 },
            { year: 2023, value: 12.0 },
          ]),
        });
      }
      if (url.includes('/api/emissions?country=Europe&metric=co2')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { year: 1990, value: 4000 },
            { year: 2023, value: 3500 },
          ]),
        });
      }
      if (url.includes('/api/emissions?country=World&metric=co2')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { year: 1990, value: 30000 },
            { year: 2023, value: 35000 },
          ]),
        });
      }
      if (url.includes('/api/emissions?country=Slovenia&metric=population')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { year: 1990, value: 2000000 },
            { year: 2023, value: 2100000 },
          ]),
        });
      }
      if (url.includes('/api/emissions?country=Europe&metric=population')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { year: 1990, value: 400000000 },
            { year: 2023, value: 450000000 },
          ]),
        });
      }
      if (url.includes('/api/emissions?country=World&metric=population')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { year: 1990, value: 5000000000 },
            { year: 2023, value: 8000000000 },
          ]),
        });
      }
      if (url.includes('/api/summary/Slovenia')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            co2: 12.0,
            trend: -15,
            co2_per_capita: 5.7,
            share_global_co2: 0.035,
          }),
        });
      }
      if (url.includes('/api/sectors/Slovenia')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            sectors: {
              coal_co2: 4.0,
              oil_co2: 3.0,
              gas_co2: 2.0,
              cement_co2: 1.0,
              flaring_co2: 0.5,
              other_co2: 1.5,
            },
          }),
        });
      }
      if (url.includes('/api/emissions?country=Slovenia&metric=co2&startYear=2008')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { year: 2008, value: 18.28 },
            { year: 2009, value: 16.20 },
          ]),
        });
      }
      if (url.includes('/api/emissions?country=Slovenia&metric=co2&startYear=2019')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { year: 2019, value: 14.04 },
            { year: 2020, value: 12.86 },
          ]),
        });
      }
      return Promise.reject(new Error('Unknown API endpoint'));
    });
    // Mock Blob and URL APIs for CSV download
    global.Blob = jest.fn((content, options) => ({ content, options }));
    global.URL.createObjectURL = jest.fn(() => 'blob:test-url');
    global.URL.revokeObjectURL = jest.fn();
    // Mock link creation for download
    const mockLink = {
      setAttribute: jest.fn(),
      click: jest.fn(),
      remove: jest.fn(),
    };
    document.createElement = jest.fn(() => mockLink);
    document.body.appendChild = jest.fn(() => mockLink);
    document.body.removeChild = jest.fn();
    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Clean up global spies
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  test('overview-graph.js loads and executes', () => {
    require('../public/js/overview-graph.js');
    expect(document.getElementById('tabContent')).toBeInTheDocument();
  });

  test('initializeCharts initializes charts when elements are present', async () => {
    require('../public/js/overview-graph.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    // No need for tabContentLoaded since trendChart exists
    // Wait for async fetch to resolve
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(global.fetch).toHaveBeenCalledTimes(11); // 1 for checkAPI + 10 for fetchData
    expect(document.getElementById('trendChart')).toBeInTheDocument();
    expect(document.getElementById('crisisChart2008')).toBeInTheDocument();
    expect(document.getElementById('crisisChart2020')).toBeInTheDocument();
    expect(document.getElementById('populationCo2Chart')).toBeInTheDocument();
    expect(global.Chart).toHaveBeenCalledTimes(4); // trendChart, crisisChart2008, crisisChart2020, populationCo2Chart
    expect(document.getElementById('currentEmissions')).toHaveTextContent('12.0 Mt');
  });

  test('initializeCharts skips initialization when elements are absent', async () => {
    document.body.innerHTML = '<div id="tabContent"></div>'; // No canvas elements
    require('../public/js/overview-graph.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    // Trigger tabContentLoaded to invoke initializeCharts
    const tabContent = document.getElementById('tabContent');
    tabContent.dispatchEvent(new CustomEvent('tabContentLoaded'));

    // Wait for async operations to resolve
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(consoleSpy).toHaveBeenCalledWith('No chart canvases found, skipping initialization');
    expect(global.Chart).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('downloadTrendChartCSV triggers download with correct data', async () => {
    require('../public/js/overview-graph.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    // Simulate data fetch to populate sloCo2Data
    await new Promise(resolve => setTimeout(resolve, 100));
    const { downloadTrendChartCSV } = window;

    downloadTrendChartCSV();

    expect(global.Blob).toHaveBeenCalledWith(
      ['Leto,CO2_Emisije_Mt\n1990,15.00\n2023,12.00\n'],
      { type: 'text/csv;charset=utf-8;' }
    );
    expect(document.createElement).toHaveBeenCalledWith('a');
  });

  test('downloadTrendChartCSV alerts when no data is available', () => {
    require('../public/js/overview-graph.js');
    const { downloadTrendChartCSV } = window;

    // Ensure sloCo2Data is empty
    window.sloCo2Data = [];
    global.alert = jest.fn();

    downloadTrendChartCSV();

    expect(global.alert).toHaveBeenCalledWith('Ni podatkov za prenos. Prosimo, poskusite znova.');
    expect(global.Blob).not.toHaveBeenCalled();
  });

  test('downloadPopulationCo2ChartCSV triggers download with correct data', async () => {
    require('../public/js/overview-graph.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    // Simulate data fetch to populate all data
    await new Promise(resolve => setTimeout(resolve, 100));
    const { downloadPopulationCo2ChartCSV } = window;

    downloadPopulationCo2ChartCSV();

    expect(global.Blob).toHaveBeenCalledWith(
      [
        'Leto,Slovenija_Prebivalstvo_milijoni,Evropa_Prebivalstvo_milijoni,Svet_Prebivalstvo_milijoni,Slovenija_CO2_Emisije_Mt,Evropa_CO2_Emisije_milijarde_t,Svet_CO2_Emisije_milijarde_t\n' +
        '1990,2.00,400.00,5000.00,15.00,4.00,30.00\n' +
        '2023,2.10,450.00,8000.00,12.00,3.50,35.00\n'
      ],
      { type: 'text/csv;charset=utf-8;' }
    );
    expect(document.createElement).toHaveBeenCalledWith('a');
  });

  test('downloadPopulationCo2ChartCSV alerts when no data is available', () => {
    require('../public/js/overview-graph.js');
    const { downloadPopulationCo2ChartCSV } = window;

    // Ensure all data is empty
    window.sloCo2Data = [];
    global.alert = jest.fn();

    downloadPopulationCo2ChartCSV();

    expect(global.alert).toHaveBeenCalledWith('Ni podatkov za prenos. Prosimo, poskusite znova.');
    expect(global.Blob).not.toHaveBeenCalled();
  });
});