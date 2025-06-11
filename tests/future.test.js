/**
 * @jest-environment jsdom
 */
global.Chart = require('./mocks/chart'); // Mock Chart.js

// Set up console spies globally to catch logs
const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

describe('Future.js', () => {
  beforeEach(() => {
    // Reset the DOM before each test
    document.body.innerHTML = `
      <canvas id="futureEmissionsLongTermChart"></canvas>
      <canvas id="sloveniaEmissionsChart"></canvas>
    `;
    
    // Mock the fetch API
    global.fetch = jest.fn();
    
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

  test('future.js loads and executes', () => {
    require('../public/js/future.js');
    expect(document.getElementById('futureEmissionsLongTermChart')).toBeInTheDocument();
    expect(document.getElementById('sloveniaEmissionsChart')).toBeInTheDocument();
  });

  test('loadGlobalEmissionsChart initializes chart with correct data', async () => {
    // Mock fetch responses for both global and Slovenia emissions
    global.fetch
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { year: 2020, co2: 34.0, upper_bound: 35.0, lower_bound: 33.0 },
            { year: 2023, co2: 38.1, upper_bound: 39.0, lower_bound: 37.0 },
            { year: 2030, co2: 35.0, upper_bound: 45.0, lower_bound: 24.0 },
          ]),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]), // Empty Slovenia data
        })
      );

    require('../public/js/future.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    // Wait for async fetch to resolve
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(global.fetch).toHaveBeenCalledWith('/api/global-emissions?startYear=2000&endYear=2100');
    expect(global.Chart).toHaveBeenCalledTimes(2);

    // Check the first Chart call (global emissions)
    expect(global.Chart).toHaveBeenCalledWith(
        expect.any(Object), // Canvas context
        expect.objectContaining({
          type: 'line',
          data: expect.objectContaining({
            datasets: expect.arrayContaining([
              expect.objectContaining({
                label: 'CO₂ emisije',
                data: expect.arrayContaining([
                  { x: 2020, y: 34.0 },
                  { x: 2023, y: 38.1 }
                ])
              }),
              expect.objectContaining({
                label: 'Najverjetneje',
                data: expect.arrayContaining([
                  { x: 2023, y: 38.1 },
                  { x: 2030, y: 35.0 }
                ])
              })
            ])
          })
        })
      );
    });

  test('loadSloveniaEmissionsChart initializes chart with correct data', async () => {
    // Mock fetch responses for both global and Slovenia emissions
    global.fetch
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]), // Empty global data
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { year: 2020, co2: 0.014, upper_bound: 0.015, lower_bound: 0.013 },
            { year: 2023, co2: 0.0133, upper_bound: 0.014, lower_bound: 0.012 },
            { year: 2030, co2: 0.012, upper_bound: 0.018, lower_bound: 0.010 },
          ]),
        })
      );

    require('../public/js/future.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    // Wait for async fetch to resolve
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(global.Chart).toHaveBeenCalledWith(
        expect.any(Object), // Canvas context
        expect.objectContaining({
          type: 'line',
          data: expect.objectContaining({
            datasets: expect.arrayContaining([
              expect.objectContaining({
                label: 'CO₂ emisije',
                data: expect.arrayContaining([
                  { x: 2020, y: 0.014 },
                  { x: 2023, y: 0.0133 }
                ])
              }),
              expect.objectContaining({
                label: 'Najverjetneje',
                data: expect.arrayContaining([
                  { x: 2023, y: 0.0133 },
                  { x: 2030, y: 0.012 }
                ])
              })
            ])
          })
        })
      );
    });

  test('loadGlobalEmissionsChart handles fetch errors', async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.reject(new Error('Fetch failed'))
    );

    require('../public/js/future.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    // Wait for async fetch to reject
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading global emissions chart:', expect.any(Error));
    expect(global.Chart).not.toHaveBeenCalled();
  });

  test('loadSloveniaEmissionsChart handles fetch errors', async () => {
    // Mock first fetch (global) to succeed, second (Slovenia) to fail
    global.fetch
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      )
      .mockImplementationOnce(() =>
        Promise.reject(new Error('Fetch failed'))
      );

    require('../public/js/future.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    // Wait for async fetch to reject
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading Slovenia emissions chart:', expect.any(Error));
    expect(global.Chart).toHaveBeenCalledTimes(1); // Only global chart initialized
  });

  test('downloadGlobalCSV generates and triggers CSV download', async () => {
    // Mock fetch to populate globalEmissionsData
    global.fetch
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { year: 2020, co2: 34.0, upper_bound: 35.0, lower_bound: 33.0 },
            { year: 2030, co2: 35.0, upper_bound: 45.0, lower_bound: 24.0 },
          ]),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      );

    require('../public/js/future.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(resolve => setTimeout(resolve, 0)); // Wait for fetch

    const { downloadGlobalCSV } = window;
    downloadGlobalCSV();

    expect(global.Blob).toHaveBeenCalledWith(
      ['Leto,Emisije_CO2,Zgornja_Meja,Spodnja_Meja\n2020,34.00,35.00,33.00\n2030,35.00,45.00,24.00\n'],
      { type: 'text/csv;charset=utf-8;' }
    );
    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
  });

  test('downloadGlobalCSV alerts when no data is available', () => {
    require('../public/js/future.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    const { downloadGlobalCSV } = window;

    global.alert = jest.fn();
    window.globalEmissionsData = []; // Ensure data is empty

    downloadGlobalCSV();

    expect(global.alert).toHaveBeenCalledWith('Podatki še niso naloženi. Počakajte trenutek in poskusite znova.');
    expect(global.Blob).not.toHaveBeenCalled();
  });

  test('downloadSloveniaCSV generates and triggers CSV download with Mt conversion', async () => {
    // Mock fetch to populate sloveniaEmissionsData
    global.fetch
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { year: 2020, co2: 0.014, upper_bound: 0.015, lower_bound: 0.013 },
            { year: 2030, co2: 0.012, upper_bound: 0.018, lower_bound: 0.010 },
          ]),
        })
      );

    require('../public/js/future.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(resolve => setTimeout(resolve, 0)); // Wait for fetch

    const { downloadSloveniaCSV } = window;
    downloadSloveniaCSV();

    expect(global.Blob).toHaveBeenCalledWith(
      ['Leto,Emisije_CO2,Zgornja_Meja,Spodnja_Meja\n2020,14.0000,15.0000,13.0000\n2030,12.0000,18.0000,10.0000\n'],
      { type: 'text/csv;charset=utf-8;' }
    );
    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
  });

  test('downloadSloveniaCSV alerts when no data is available', () => {
    require('../public/js/future.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    const { downloadSloveniaCSV } = window;

    global.alert = jest.fn();
    window.sloveniaEmissionsData = []; 

    downloadSloveniaCSV();

    expect(global.alert).toHaveBeenCalledWith('Podatki še niso naloženi. Počakajte trenutek in poskusite znova.');
    expect(global.Blob).not.toHaveBeenCalled();
  });
});