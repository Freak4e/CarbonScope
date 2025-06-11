/**
 * @jest-environment jsdom
 */
global.Chart = require('./mocks/chart'); // Mock Chart.js

// Mock jQuery
const jQueryMock = jest.fn((selector) => {
  const element = document.querySelector(selector);
  return {
    length: element ? 1 : 0,
    select2: jest.fn().mockReturnValue({
      val: jest.fn().mockImplementation(() => {
        if (!element) return [];
        const selectedOptions = element.querySelectorAll('option:checked');
        return Array.from(selectedOptions).map(opt => opt.value);
      }),
      empty: jest.fn(),
      append: jest.fn(),
      on: jest.fn(),
    }),
    val: jest.fn().mockImplementation(() => {
      if (!element) return [];
      const selectedOptions = element.querySelectorAll('option:checked');
      return Array.from(selectedOptions).map(opt => opt.value);
    }),
  };
});
global.$ = global.jQuery = jQueryMock;

describe('Comparison Dashboard - Emissions Line Chart', () => {
  let consoleSpy, consoleErrorSpy, consoleWarnSpy;

  beforeEach(() => {
    // Reset the DOM
    document.body.innerHTML = `
      <div id="tabContent"></div>
      <canvas id="emissionsChart"></canvas>
      <select id="countrySelect" multiple>
        <option value="Slovenia" selected>Slovenia</option>
        <option value="China" selected>China</option>
        <option value="Germany">Germany</option>
      </select>
      <select id="metricSelect">
        <option value="co2" selected>CO2</option>
      </select>
      <input id="startYearInput" value="1990">
      <input id="endYearInput" value="2022">
      <button id="updateBtn"></button>
      <h2 id="chartTitle"></h2>
    `;

    // Reset jQuery mock
    jQueryMock.mockReset();
    jQueryMock.mockImplementation((selector) => {
      const element = document.querySelector(selector);
      return {
        length: element ? 1 : 0,
        select2: jest.fn().mockReturnValue({
          val: jest.fn().mockImplementation(() => {
            if (!element) return [];
            const selectedOptions = element.querySelectorAll('option:checked');
            return Array.from(selectedOptions).map(opt => opt.value);
          }),
          empty: jest.fn(),
          append: jest.fn(),
          on: jest.fn(),
        }),
        val: jest.fn().mockImplementation(() => {
          if (!element) return [];
          const selectedOptions = element.querySelectorAll('option:checked');
          return Array.from(selectedOptions).map(opt => opt.value);
        }),
      };
    });

    // Mock fetch API
    global.fetch = jest.fn((url) => {
      if (url.includes('/api/countries')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(['Slovenia', 'China', 'Germany']),
        });
      }
      if (url.includes('/api/emissions')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { year: 1990, country: 'Slovenia', value: 5.0 },
            { year: 1991, country: 'Slovenia', value: 5.2 },
            { year: 1990, country: 'China', value: 2.0 },
            { year: 1991, country: 'China', value: 2.2 },
          ]),
        });
      }
      return Promise.reject(new Error('Invalid URL'));
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

    // Set up console spies
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  test('initDashboard initializes emissions chart when canvas is present', () => {
    require('../public/js/comparison.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    expect(document.getElementById('emissionsChart')).toBeInTheDocument();
    expect(global.Chart).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: 'line',
        data: { labels: [], datasets: [] },
        options: expect.any(Object),
      })
    );
    expect(consoleWarnSpy).not.toHaveBeenCalledWith('Emissions chart canvas not found');
  });

test('updateEmissionsChart fetches and updates chart with correct data', async () => {
  require('../public/js/comparison.js');
  document.dispatchEvent(new Event('DOMContentLoaded'));

  const updateBtn = document.getElementById('updateBtn');
  updateBtn.click();

  await new Promise(resolve => setTimeout(resolve, 0));

  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining('/api/emissions?country=Slovenia&metric=co2&startYear=1990&endYear=2022')
  );
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining('/api/emissions?country=China&metric=co2&startYear=1990&endYear=2022')
  );
  expect(consoleSpy).toHaveBeenCalledWith('Data for Slovenia:', expect.any(Array));
  expect(consoleSpy).toHaveBeenCalledWith('Data for China:', expect.any(Array));

  const chartInstance = global.Chart.mock.results[0].value;
  expect(chartInstance.data.labels).toEqual([1990, 1991, 1990, 1991]);
 expect(chartInstance.data.datasets).toEqual([
  expect.objectContaining({
    label: 'Slovenia',
    data: [5.0, 5.2, 2.0, 2.2],
    borderColor: expect.any(String),
    backgroundColor: 'transparent',
    borderWidth: 2,
    fill: false,
    tension: 0.1,
  }),
  expect.objectContaining({
    label: 'China',
    data: [5.0, 5.2, 2.0, 2.2], 
    borderColor: expect.any(String),
    backgroundColor: 'transparent',
    borderWidth: 2,
    fill: false,
    tension: 0.1,
  }),
]);
  expect(chartInstance.options.scales.y.title.text).toBe('CO₂ emisije (milijon ton)');
  expect(chartInstance.update).toHaveBeenCalled();
  expect(document.getElementById('chartTitle').textContent).toBe('Skupni CO₂ za Slovenia, China (1990-2022)');
});

  test('updateEmissionsChart handles no selected countries', async () => {
    const countrySelect = document.getElementById('countrySelect');
    countrySelect.querySelectorAll('option').forEach(opt => opt.selected = false);
    jQueryMock.mockImplementation((selector) => {
      const element = document.querySelector(selector);
      return {
        length: element ? 1 : 0,
        select2: jest.fn().mockReturnValue({
          val: jest.fn().mockReturnValue([]),
          empty: jest.fn(),
          append: jest.fn(),
          on: jest.fn(),
        }),
        val: jest.fn().mockReturnValue([]),
      };
    });

    require('../public/js/comparison.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const updateBtn = document.getElementById('updateBtn');
    updateBtn.click();

    await new Promise(resolve => setTimeout(resolve, 0));

    const chartInstance = global.Chart.mock.results[0].value;
    expect(chartInstance.data.labels).toEqual([]);
    expect(chartInstance.data.datasets).toEqual([]);
    expect(chartInstance.update).toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalledWith(expect.stringContaining('/api/emissions'));
  });

  test('updateEmissionsChart handles fetch errors gracefully', async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/countries')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(['Slovenia', 'China', 'Germany']),
        });
      }
      return Promise.reject(new Error('Fetch failed'));
    });

    require('../public/js/comparison.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const updateBtn = document.getElementById('updateBtn');
    updateBtn.click();

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching emissions data for Slovenia:', expect.any(Error));
    const chartInstance = global.Chart.mock.results[0].value;
    expect(chartInstance.data.labels).toEqual([]);
    expect(chartInstance.data.datasets).toEqual([]);
    expect(chartInstance.update).toHaveBeenCalled();
  });

  test('updateEmissionsChart stores valid data for CSV', async () => {
    require('../public/js/comparison.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const updateBtn = document.getElementById('updateBtn');
    updateBtn.click();

    await new Promise(resolve => setTimeout(resolve, 0));

    const expectedData = [
      { year: 1990, country: 'Slovenia', value: 5.0 },
      { year: 1991, country: 'Slovenia', value: 5.2 },
      { year: 1990, country: 'China', value: 2.0 },
      { year: 1991, country: 'China', value: 2.2 },
      { year: 1990, country: 'Slovenia', value: 5.0 },
      { year: 1991, country: 'Slovenia', value: 5.2 },
      { year: 1990, country: 'China', value: 2.0 },
      { year: 1991, country: 'China', value: 2.2 },
    ];
    expect(consoleSpy).toHaveBeenCalledWith('Emissions data for CSV:', expectedData);
  });

  test('downloadEmissionsCSV triggers download with correct data', async () => {
    require('../public/js/comparison.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const updateBtn = document.getElementById('updateBtn');
    updateBtn.click();
    await new Promise(resolve => setTimeout(resolve, 0));

    window.downloadEmissionsCSV('displayed');

    expect(global.Blob).toHaveBeenCalledWith(
      [
        'Year,Country,Skupni_CO₂_milijonton\n' +
        '1990,Slovenia,5.00\n' +
        '1991,Slovenia,5.20\n' +
        '1990,China,2.00\n' +
        '1991,China,2.20\n' +
        '1990,Slovenia,5.00\n' +
        '1991,Slovenia,5.20\n' +
        '1990,China,2.00\n' +
        '1991,China,2.20\n'
      ],
      { type: 'text/csv;charset=utf-8;' }
    );
    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
  });

  test('downloadEmissionsCSV alerts when no data is available', () => {
    require('../public/js/comparison.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    global.alert = jest.fn();
    window.downloadEmissionsCSV('displayed');

    expect(global.alert).toHaveBeenCalledWith('Podatki še niso naloženi ali ni izbranih držav. Posodobite graf in poskusite znova.');
    expect(global.Blob).not.toHaveBeenCalled();
  });

  test('downloadEmissionsCSV alerts when no countries are selected', () => {
    const countrySelect = document.getElementById('countrySelect');
    countrySelect.querySelectorAll('option').forEach(opt => opt.selected = false);
    jQueryMock.mockImplementation((selector) => {
      const element = document.querySelector(selector);
      return {
        length: element ? 1 : 0,
        select2: jest.fn().mockReturnValue({
          val: jest.fn().mockReturnValue([]),
          empty: jest.fn(),
          append: jest.fn(),
          on: jest.fn(),
        }),
        val: jest.fn().mockReturnValue([]),
      };
    });

    require('../public/js/comparison.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    window.emissionsData = [];
    global.alert = jest.fn();

    window.downloadEmissionsCSV('displayed');

    expect(global.alert).toHaveBeenCalledWith('Podatki še niso naloženi ali ni izbranih držav. Posodobite graf in poskusite znova.');
    expect(global.Blob).not.toHaveBeenCalled();
  });
});