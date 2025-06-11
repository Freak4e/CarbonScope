/**
 * @jest-environment jsdom
 */

require('../public/js/globe.js');

describe('Globe Visualization', () => {
  let consoleErrorSpy, consoleWarnSpy;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <div id="tabContent"></div>
      <div id="globeContainer"></div>
      <div id="legendContainer"><div id="legend"></div></div>
    `;

    // Mock fetch
    global.fetch = jest.fn((url) => {
      if (url === '/api/globe-data') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { iso_code: 'CHN', country: 'China', co2_per_capita: 7.1, co2: 10065, population: 1412600000 },
            ]),
        });
      }
      if (url === 'https://unpkg.com/world-atlas@2.0.2/countries-110m.json') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              objects: {
                countries: {
                  type: 'GeometryCollection',
                  geometries: [
                    { id: '004', properties: { name: 'Afghanistan' }, type: 'Polygon' },
                    { id: '156', properties: { name: 'China' }, type: 'Polygon' },
                    { id: '999', properties: { name: 'Unknown' }, type: null },
                  ],
                },
              },
            }),
        });
      }
      if (url.includes('/api/emissions')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { year: 2000, value: 100 },
              { year: 2001, value: 110 },
            ]),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    // Mock D3
    const mockD3Selection = {
      append: jest.fn().mockReturnThis(),
      attr: jest.fn().mockReturnThis(),
      selectAll: jest.fn().mockReturnThis(),
      data: jest.fn().mockReturnThis(),
      enter: jest.fn().mockReturnThis(),
      html: jest.fn().mockReturnThis(),
      style: jest.fn().mockReturnThis(),
      call: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      remove: jest.fn().mockReturnThis(),
      node: jest.fn(() => ({ offsetWidth: 200, offsetHeight: 100 })),
    };

    global.d3 = {
      select: jest.fn(() => mockD3Selection),
      geoMercator: jest.fn(() => ({
        scale: jest.fn().mockReturnThis(),
        translate: jest.fn().mockReturnThis(),
        center: jest.fn().mockReturnThis(),
      })),
      geoPath: jest.fn(() => ({
        projection: jest.fn(() => ({
          centroid: jest.fn(() => [100, 100]),
        })),
        mockImplementation: (d) => (d && d.type ? 'M 0 0 L 10 10' : null),
      })),
      scaleSequential: jest.fn(() => {
        const scale = jest.fn((value) => `rgb(${value * 10}, 100, 200)`);
        scale.domain = jest.fn().mockReturnThis();
        return scale;
      }),
      interpolateViridis: jest.fn((t) => `rgb(${t * 255}, 100, 200)`),
      zoom: jest.fn(() => ({
        scaleExtent: jest.fn().mockReturnThis(),
        translateExtent: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
      })),
      range: jest.fn((start, end, step) => {
        const result = [];
        for (let i = start; i < end; i += step) result.push(i);
        return result;
      }),
    };

    // Mock topojson
    global.topojson = {
      feature: jest.fn((topo, obj) => ({
        type: 'FeatureCollection',
        features: obj.geometries.map((geo) => ({
          id: geo.id,
          properties: geo.properties,
          geometry: geo.type ? {} : null,
        })),
      })),
    };

    // Mock Chart.js
    global.Chart = jest.fn(() => ({
      destroy: jest.fn(),
      data: { labels: [], datasets: [] },
      options: {},
      update: jest.fn(),
    }));

    // Mock canvas context
    document.getElementById = jest.fn((id) => {
      if (id.startsWith('co2-chart-')) {
        return { getContext: jest.fn(() => ({})) };
      }
      return document.querySelector(`#${id}`);
    });

    // Spies for console
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    // Mock window event listeners
    window.addEventListener = jest.fn((event, callback) => {
      if (event === 'resize') {
        window.resizeCallback = callback;
      }
    });

    // Trigger DOMContentLoaded
    document.dispatchEvent(new Event('DOMContentLoaded'));
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  test('initMap does not initialize if DOM elements are missing', () => {
    document.body.innerHTML = '';
    window.initMap();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Map elements not found.');
    expect(document.querySelector('p')?.textContent).toBeUndefined();
  });

  test('initMap sets overflow hidden on globeContainer', () => {
    window.initMap();
    expect(document.getElementById('globeContainer').style.overflow).toBe('hidden');
  });

  test('initializeGlobe fetches data and initializes map', async () => {
    window.initMap();
    await new Promise((resolve) => setTimeout(resolve, 0)); 

    expect(global.fetch).toHaveBeenCalledWith('/api/globe-data');
    expect(global.fetch).toHaveBeenCalledWith('https://unpkg.com/world-atlas@2.0.2/countries-110m.json');
    expect(d3.select).toHaveBeenCalled();
    expect(document.getElementById('legendContainer').style.display).toBe('block');
  });

  test('initializeGlobe uses fallback data on fetch failure', async () => {
    global.fetch.mockImplementationOnce(() => Promise.reject(new Error('Fetch failed')));

    window.initMap();
    await new Promise((resolve) => setTimeout(resolve, 0)); 

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading CO₂ data:', expect.any(Error));
    expect(consoleWarnSpy).toHaveBeenCalledWith('Using fallback CO₂ data.');
    expect(global.fetch).toHaveBeenCalledWith('https://unpkg.com/world-atlas@2.0.2/countries-110m.json');
    expect(d3.select).toHaveBeenCalled();
  });

 

 
  test('tabContentLoaded event triggers initMap for map.html', () => {
    const initMapSpy = jest.spyOn(window, 'initMap');
    const tabContent = document.getElementById('tabContent');
    const event = new CustomEvent('tabContentLoaded', { detail: { tab: 'map.html' } });
    tabContent.dispatchEvent(event);
    expect(initMapSpy).toHaveBeenCalled();
  });
});