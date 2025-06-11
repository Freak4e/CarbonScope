/**
 * @jest-environment jsdom
 */
global.Chart = require('./mocks/chart'); // Mock Chart.js

// Set up console spies globally to catch all logs
const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

describe('Dashboard', () => {
  beforeEach(() => {
    // Reset the DOM before each test
    document.body.innerHTML = `
      <div id="tabContent"></div>
      <canvas id="totalEmissionsChart"></canvas>
      <canvas id="globalShareChart"></canvas>
    `;
    // Mock the fetch API
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          data: [
            { year: 2020, country: 'USA', co2: 5.0, share_global_co2: 13.5 },
            { year: 2021, country: 'USA', co2: 5.2, share_global_co2: 13.8 },
            { year: 2020, country: 'China', co2: 10.0, share_global_co2: 27.0 },
            { year: 2021, country: 'China', co2: 10.5, share_global_co2: 27.5 },
          ],
          countries: ['USA', 'China'],
        }),
      })
    );
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

  test('dashboard.js loads and executes', () => {
    require('../public/js/dashboard.js');
    // No console log assertion since 'dashboard.js loaded' was removed
    expect(document.getElementById('tabContent')).toBeInTheDocument();
  });

  test('initDashboard initializes charts when elements are present', () => {
    require('../public/js/dashboard.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    // Trigger tabContentLoaded event for overview tab
    const tabContent = document.getElementById('tabContent');
    tabContent.dispatchEvent(new CustomEvent('tabContentLoaded', { detail: { tab: 'overview-svet.html' } }));

    expect(document.getElementById('totalEmissionsChart')).toBeInTheDocument();
    expect(document.getElementById('globalShareChart')).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalledWith('Total Emissions Chart initialized');
    expect(consoleSpy).toHaveBeenCalledWith('Global Share Chart initialized');
    expect(consoleSpy).toHaveBeenCalledWith('Fetching data for top countries charts...');
  });

  test('initDashboard skips initialization when elements are absent', () => {
    document.body.innerHTML = '<div id="tabContent"></div>'; // No canvas elements
    require('../public/js/dashboard.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    // Trigger tabContentLoaded event for overview tab
    const tabContent = document.getElementById('tabContent');
    tabContent.dispatchEvent(new CustomEvent('tabContentLoaded', { detail: { tab: 'overview-svet.html' } }));

    expect(consoleSpy).toHaveBeenCalledWith('No overview dashboard elements found, skipping initialization');
    expect(consoleSpy).not.toHaveBeenCalledWith('Total Emissions Chart initialized');
    expect(consoleSpy).not.toHaveBeenCalledWith('Global Share Chart initialized');
  });

  test('updateTopCountriesCharts fetches and updates charts correctly', async () => {
    require('../public/js/dashboard.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    // Trigger tabContentLoaded to initialize
    const tabContent = document.getElementById('tabContent');
    tabContent.dispatchEvent(new CustomEvent('tabContentLoaded', { detail: { tab: 'overview-svet.html' } }));

    // Wait for async fetch to resolve
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(global.fetch).toHaveBeenCalledWith('/api/top_countries?startYear=1750&endYear=2023');
    expect(consoleSpy).toHaveBeenCalledWith('Data fetched:', {
      data: expect.any(Array),
      countries: ['USA', 'China'],
    });
    expect(consoleSpy).toHaveBeenCalledWith('Total Emissions Chart updated with', 2, 'datasets');
    expect(consoleSpy).toHaveBeenCalledWith('Global Share Chart updated with', 2, 'datasets');
  });

  test('updateTopCountriesCharts handles fetch errors', async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.reject(new Error('Fetch failed'))
    );
    require('../public/js/dashboard.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    // Trigger tabContentLoaded
    const tabContent = document.getElementById('tabContent');
    tabContent.dispatchEvent(new CustomEvent('tabContentLoaded', { detail: { tab: 'overview-svet.html' } }));

    // Wait for async fetch to reject
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating top countries charts:', expect.any(Error));
  });

  test('downloadCSV generates and triggers CSV download', () => {
    require('../public/js/dashboard.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    const data = [
      { year: 2020, country: 'USA', co2: 5.0, share_global_co2: 13.5 },
    ];
    const headers = ['Year', 'Country', 'Value'];
    const rowFormatter = row => `${row.year},${row.country},${row.co2}`;
    const filename = 'test.csv';

    window.downloadCSV(data, filename, headers, rowFormatter);

    expect(consoleSpy).toHaveBeenCalledWith('Generating CSV for:', filename, 'Data:', data);
    expect(global.Blob).toHaveBeenCalledWith(
      ['Year,Country,Value\n2020,USA,5\n'],
      { type: 'text/csv;charset=utf-8;' }
    );
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
  });

  test('downloadTotalEmissionsCSV triggers download with correct data', async () => {
    require('../public/js/dashboard.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    // Simulate data fetch to populate topCountriesData
    const tabContent = document.getElementById('tabContent');
    tabContent.dispatchEvent(new CustomEvent('tabContentLoaded', { detail: { tab: 'overview-svet.html' } }));
    await new Promise(resolve => setTimeout(resolve, 0)); // Wait for fetch
    const { downloadTotalEmissionsCSV } = window;

    downloadTotalEmissionsCSV();

    expect(global.Blob).toHaveBeenCalledWith(
      ['Year,Country,CO2_Emissions_Billion_Tonnes\n2020,USA,5.0000\n2021,USA,5.2000\n2020,China,10.0000\n2021,China,10.5000\n'],
      { type: 'text/csv;charset=utf-8;' }
    );
    expect(document.createElement).toHaveBeenCalledWith('a');
  });

  test('downloadTotalEmissionsCSV alerts when no data is available', () => {
    require('../public/js/dashboard.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    const { downloadTotalEmissionsCSV } = window;

    // Ensure topCountriesData is empty
    window.topCountriesData = [];
    global.alert = jest.fn();

    downloadTotalEmissionsCSV();

    expect(global.alert).toHaveBeenCalledWith('Podatki še niso naloženi. Počakajte trenutek in poskusite znova.');
    expect(global.Blob).not.toHaveBeenCalled();
  });

  test('downloadGlobalShareCSV triggers download with correct data', async () => {
    require('../public/js/dashboard.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    // Simulate data fetch to populate topCountriesData
    const tabContent = document.getElementById('tabContent');
    tabContent.dispatchEvent(new CustomEvent('tabContentLoaded', { detail: { tab: 'overview-svet.html' } }));
    await new Promise(resolve => setTimeout(resolve, 0)); // Wait for fetch
    const { downloadGlobalShareCSV } = window;

    downloadGlobalShareCSV();

    expect(global.Blob).toHaveBeenCalledWith(
      ['Year,Country,Share_Global_CO2_Percent\n2020,USA,13.50\n2021,USA,13.80\n2020,China,27.00\n2021,China,27.50\n'],
      { type: 'text/csv;charset=utf-8;' }
    );
    expect(document.createElement).toHaveBeenCalledWith('a');
  });

  test('downloadGlobalShareCSV alerts when no data is available', () => {
    require('../public/js/dashboard.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    const { downloadGlobalShareCSV } = window;

    // Ensure topCountriesData is empty
    window.topCountriesData = [];
    global.alert = jest.fn();

    downloadGlobalShareCSV();

    expect(global.alert).toHaveBeenCalledWith('Podatki še niso naloženi. Počakajte trenutek in poskusite znova.');
    expect(global.Blob).not.toHaveBeenCalled();
  });
});