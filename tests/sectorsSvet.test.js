/**
 * @jest-environment jsdom
 */

require('../public/js/sectorsSvet.js');

describe('Sectors Visualization', () => {
  let consoleErrorSpy, consoleWarnSpy, alertSpy;

  beforeEach(() => {
    document.body.innerHTML = `
      <select id="unifiedCountrySelect"></select>
      <canvas id="sectorChart"></canvas>
      <canvas id="sectorLineChart"></canvas>
      <canvas id="globalSectorChart"></canvas>
    `;
// Mock jQuery
const mockJQueryElement = {
  length: 1,
  select2: jest.fn().mockReturnThis(),
  val: jest.fn().mockReturnValue('World'),
  on: jest.fn().mockReturnThis(),
  empty: jest.fn().mockReturnThis(),
  append: jest.fn().mockReturnThis(),
  trigger: jest.fn().mockReturnThis(),
};
global.$ = jest.fn((selector) => {
  if (selector === '#unifiedCountrySelect' && !document.querySelector(selector)) {
    return { ...mockJQueryElement, length: 0 };
  }
  return mockJQueryElement;
});
    // Mock fetch
    global.fetch = jest.fn((url) => {
      if (url === '/api/countries') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(['World', 'Slovenia', 'China', 'Europe']),
        });
      }
      if (url.includes('/api/sectors/World?year=2022')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              sectors: {
                coal_co2: 100,
                oil_co2: 200,
                gas_co2: 300,
                cement_co2: 50,
                flaring_co2: 20,
                other_co2: 10,
              },
            }),
        });
      }
      if (url.includes('/api/emissions?country=World')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { year: 1990, value: 1000 },
              { year: 1991, value: 1100 },
            ]),
        });
      }
      if (url.includes('/api/sectors/World?year=1990') || url.includes('/api/sectors/World?year=1991')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              sectors: {
                coal_co2: 100,
                oil_co2: 200,
                gas_co2: 300,
                cement_co2: 50,
                flaring_co2: 20,
                other_co2: 10,
              },
            }),
        });
      }
      if (url.includes('/api/sector-emissions?entity=World')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                Year: '1990',
                'Carbon dioxide emissions from buildings': 100,
                'Carbon dioxide emissions from industry': 200,
                'Carbon dioxide emissions from land use change and forestry': 300,
                'Carbon dioxide emissions from other fuel combustion': 50,
                'Carbon dioxide emissions from transport': 150,
                'Carbon dioxide emissions from manufacturing and construction': 250,
                'Fugitive emissions of carbon dioxide from energy production': 75,
                'Carbon dioxide emissions from electricity and heat': 400,
                'Carbon dioxide emissions from bunker fuels': 25,
              },
              {
                Year: '1991',
                'Carbon dioxide emissions from buildings': 110,
                'Carbon dioxide emissions from industry': 210,
                'Carbon dioxide emissions from land use change and forestry': 310,
                'Carbon dioxide emissions from other fuel combustion': 55,
                'Carbon dioxide emissions from transport': 160,
                'Carbon dioxide emissions from manufacturing and construction': 260,
                'Fugitive emissions of carbon dioxide from energy production': 80,
                'Carbon dioxide emissions from electricity and heat': 410,
                'Carbon dioxide emissions from bunker fuels': 30,
              },
            ]),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    // Mock Chart.js
    global.Chart = jest.fn(() => ({
      data: { labels: [], datasets: [] },
      options: { plugins: { title: { text: '' } } },
      update: jest.fn(),
      destroy: jest.fn(),
    }));

    // Mock canvas context
    document.getElementById = jest.fn((id) => {
      if (['sectorChart', 'sectorLineChart', 'globalSectorChart'].includes(id)) {
        return { getContext: jest.fn(() => ({})) };
      }
      return document.querySelector(`#${id}`);
    });

    // Mock Blob and URL
    global.Blob = jest.fn(() => ({}));
    global.URL = {
      createObjectURL: jest.fn(() => 'blob://test'),
      revokeObjectURL: jest.fn(),
    };

    // Mock console and alert
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    alertSpy = jest.spyOn(window, 'alert').mockImplementation();

    // Trigger DOMContentLoaded
    document.dispatchEvent(new Event('DOMContentLoaded'));
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    alertSpy.mockRestore();
  });

test('initSectorsTab initializes Select2 and loads countries', async () => {
  expect($).toHaveBeenCalledWith('#unifiedCountrySelect');
  expect(global.$('#unifiedCountrySelect').select2).toHaveBeenCalledWith(
    expect.objectContaining({
      placeholder: 'Izberi državo...',
      allowClear: true,
      width: '100%',
      minimumResultsForSearch: 1,
    })
  );
  expect(global.fetch).toHaveBeenCalledWith('/api/countries');
  expect(global.$('#unifiedCountrySelect').append).toHaveBeenCalled();
});

test('initSectorsTab does not proceed if unifiedCountrySelect is missing', async () => {
  document.body.innerHTML = '';
  jest.resetAllMocks();
  global.$ = jest.fn((selector) => ({
    length: 0,
    select2: jest.fn().mockReturnThis(),
    val: jest.fn().mockReturnValue(null),
    on: jest.fn().mockReturnThis(),
    empty: jest.fn().mockReturnThis(),
    append: jest.fn().mockReturnThis(),
    trigger: jest.fn().mockReturnThis(),
  }));
  await window.initSectorsTab();
  expect(consoleWarnSpy).toHaveBeenCalledWith('unifiedCountrySelect not found');
  expect(global.fetch).not.toHaveBeenCalled();
});
  test('initSectorCharts initializes all charts', () => {
    window.initSectorsTab();
    expect(global.Chart).toHaveBeenCalledTimes(3);
    expect(global.Chart).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ type: 'pie' })
    );
    expect(global.Chart).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ type: 'line' })
    );
  });

  test('updateSectorChart updates pie chart with data', async () => {
    await window.updateSectorChart('World', 2022);
    const chartInstance = global.Chart.mock.results[0].value;
    expect(global.fetch).toHaveBeenCalledWith('/api/sectors/World?year=2022');
    expect(chartInstance.data.labels).toEqual(['Premog', 'Nafta', 'Plin', 'Cement', 'Sežiganje', 'Drugo']);
    expect(chartInstance.data.datasets[0].data).toEqual([100, 200, 300, 50, 20, 10]);
    expect(chartInstance.options.plugins.title.text).toBe('Emisije CO₂ po sektorjih v World (2022)');
    expect(chartInstance.update).toHaveBeenCalled();
  });

  test('updateSectorChart handles fetch errors', async () => {
    global.fetch.mockImplementationOnce(() => Promise.reject(new Error('Fetch failed')));
    await window.updateSectorChart('World', 2022);
    const chartInstance = global.Chart.mock.results[0].value;
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading sector data for World:', expect.any(Error));
    expect(chartInstance.data.labels).toEqual([]);
    expect(chartInstance.data.datasets).toEqual([]);
    expect(chartInstance.options.plugins.title.text).toBe('Podatki za World niso na voljo');
  });

  test('updateSectorLineChart updates line chart with data', async () => {
    await window.updateSectorLineChart('World');
    const chartInstance = global.Chart.mock.results[1].value;
    expect(global.fetch).toHaveBeenCalledWith('/api/emissions?country=World&startYear=1990&endYear=2022');
    expect(chartInstance.data.labels).toEqual([1990, 1991]);
    expect(chartInstance.data.datasets).toHaveLength(6);
    expect(chartInstance.options.plugins.title.text).toBe('Trendi emisij CO₂ po vrsti goriva v World (1990–2022)');
    expect(chartInstance.update).toHaveBeenCalled();
  });

  test('updateGlobalSectorChart updates global line chart with data', async () => {
    await window.updateGlobalSectorChart('World');
    const chartInstance = global.Chart.mock.results[2].value;
    expect(global.fetch).toHaveBeenCalledWith('/api/sector-emissions?entity=World&year=1990:2021');
    expect(chartInstance.data.labels).toEqual([1990, 1991]);
    expect(chartInstance.data.datasets).toHaveLength(9);
    expect(chartInstance.data.datasets[0].label).toBe('Zgradbe');
    expect(chartInstance.options.plugins.title.text).toBe('Globalne emisije CO₂ po sektorjih v World (1990-1991)');
    expect(chartInstance.update).toHaveBeenCalled();
  });

  test('downloadSectorCSV downloads displayed data', async () => {
    await window.updateSectorChart('World', 2022);
    await window.downloadSectorCSV('displayed');
    expect(global.Blob).toHaveBeenCalledWith(
      expect.arrayContaining([expect.stringContaining('Premog,100.00')]),
      expect.any(Object)
    );
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  test('downloadSectorCSV alerts on no data', async () => {
    global.$().val.mockReturnValue(null);
    await window.downloadSectorCSV('displayed');
    expect(alertSpy).toHaveBeenCalledWith('Izberite državo ali posodobite graf za prenos prikazanih podatkov.');
    expect(global.Blob).not.toHaveBeenCalled();
  });


});