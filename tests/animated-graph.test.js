/**
 * @jest-environment jsdom
 */
global.Chart = require('./mocks/chart'); // Mock Chart.js

// Set up console spies
const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

describe('Animated Graph', () => {
  let initGraph;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <div id="tabContent"></div>
      <button id="playPauseButton"></button>
      <div id="chartContainer"><canvas id="co2Chart"></canvas></div>
      <div class="slider">
        <div id="interval"></div>
        <div id="startHandle" aria-valuenow="1750"></div>
        <div id="endHandle" aria-valuenow="2023"></div>
        <div id="startTooltip" style="display: none;"></div>
        <div id="endTooltip" style="display: none;"></div>
      </div>
    `;
    // Mock canvas getContext
    const chartCanvas = document.getElementById('co2Chart');
    chartCanvas.getContext = jest.fn(() => ({
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      scale: jest.fn(),
      drawImage: jest.fn(),
      fillText: jest.fn(),
      measureText: jest.fn(() => ({ width: 0 })),
    }));
    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            { year: 2020, co2: 34.8 },
            { year: 2021, co2: 36.0 },
            { year: 2022, co2: 36.8 },
            { year: 2023, co2: 37.4 },
          ]),
      })
    );
    // Mock Blob and URL APIs
    global.Blob = jest.fn((content, options) => ({ content, options }));
    global.URL.createObjectURL = jest.fn(() => 'blob:test-url');
    global.URL.revokeObjectURL = jest.fn();
    // Mock link creation
    const mockLink = {
      setAttribute: jest.fn(),
      click: jest.fn(),
      remove: jest.fn(),
    };
    document.createElement = jest.fn(() => mockLink);
    document.body.appendChild = jest.fn(() => mockLink);
    document.body.removeChild = jest.fn();
    // Load script
    initGraph = require('../public/js/animatedgraph.js').initGraph;
    // Trigger DOMContentLoaded
    document.dispatchEvent(new Event('DOMContentLoaded'));
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

  test('initGraph validates DOM elements and logs error if missing', () => {
    document.body.innerHTML = '<div id="tabContent"></div>';
    initGraph();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Graph elements not found.');
  });

  test('fetchData retrieves data successfully', async () => {
    jest.useFakeTimers();
    initGraph();
    await jest.runAllTimersAsync();
    expect(global.fetch).toHaveBeenCalledWith('/api/animated-graph');
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    jest.useRealTimers();
  }, 10000);

  test('fetchData uses fallback data on fetch error', async () => {
    jest.useFakeTimers();
    global.fetch.mockImplementationOnce(() => Promise.reject(new Error('Fetch failed')));
    initGraph();
    await jest.runAllTimersAsync();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching animated graph data:', expect.any(Error));
    expect(consoleWarnSpy).toHaveBeenCalledWith('Using fallback data for CO₂ emissions.');
    jest.useRealTimers();
  }, 10000);

  test('initializeChart creates chart with correct configuration', async () => {
    jest.useFakeTimers();
    initGraph();
    await jest.runAllTimersAsync();
    const chartCanvas = document.getElementById('co2Chart');
    expect(chartCanvas.getContext).toHaveBeenCalledWith('2d');
    expect(global.Chart).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: 'line',
        data: expect.objectContaining({
          labels: [2020, 2021, 2022, 2023],
          datasets: expect.arrayContaining([
            expect.objectContaining({
              label: 'Globalne emisije CO₂ (milijarde ton)',
              data: [34.8, 36.0, 36.8, 37.4],
            }),
          ]),
        }),
      })
    );
    jest.useRealTimers();
  }, 10000);


  test('updateHandlePosition updates start handle correctly', async () => {
    jest.useFakeTimers();
    initGraph();
    await jest.runAllTimersAsync();
    const startHandle = document.getElementById('startHandle');
    const startTooltip = document.getElementById('startTooltip');
    const interval = document.getElementById('interval');
    const slider = document.querySelector('.slider');
    slider.getBoundingClientRect = jest.fn(() => ({ left: 0, width: 100 }));
    const event = { clientX: 50 };
    const mousedownEvent = new Event('mousedown');
    startHandle.dispatchEvent(mousedownEvent);
    document.dispatchEvent(new MouseEvent('mousemove', event));
    document.dispatchEvent(new Event('mouseup'));
    expect(startHandle.style.left).toBe('50%');
    expect(interval.style.left).toBe('50%');
    expect(startTooltip.style.display).toBe('none');
    jest.useRealTimers();
  }, 10000);

  test('downloadAnimatedGraphCSV triggers CSV download', async () => {
    jest.useFakeTimers();
    initGraph();
    await jest.runAllTimersAsync();
    window.downloadAnimatedGraphCSV();
    expect(global.Blob).toHaveBeenCalledWith(
      ['Year,CO2_Emissions_Billion_Tonnes\n2020,34.80\n2021,36.00\n2022,36.80\n2023,37.40\n'],
      { type: 'text/csv;charset=utf-8;' }
    );
    expect(document.createElement).toHaveBeenCalledWith('a');
    jest.useRealTimers();
  }, 10000);


});