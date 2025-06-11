/**
 * @jest-environment jsdom
 */

require('../public/js/kalkulator.js');

describe('CO2 Calculator', () => {
  let consoleErrorSpy, alertSpy;
  let mockMap, mockTileLayer, mockMarker, mockGeoJSON, mockRoutingControl;

  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <a href="#"><i class="fa-calculator"></i></a>
      <div id="co2CalculatorModal" class="modal">
        <div id="routeMap"></div>
        <input id="startPoint" />
        <input id="endPoint" />
        <span id="distanceResult">-</span>
        <span id="co2Result">-</span>
        <div id="co2Comparison"></div>
        <button class="transport-mode" data-mode="walking">Walking</button>
        <button class="transport-mode" data-mode="cycling">Cycling</button>
        <button class="transport-mode" data-mode="driving">Driving</button>
        <button class="transport-mode" data-mode="bus">Bus</button>
        <button class="transport-mode" data-mode="airplane">Airplane</button>
        <button id="calculateBtn">Calculate</button>
        <div id="calculationOverlay" style="display: none;"></div>
      </div>
    `;

    // Mock Leaflet
    mockMap = {
      setView: jest.fn().mockReturnThis(),
      addLayer: jest.fn().mockReturnThis(),
      removeLayer: jest.fn().mockReturnThis(),
      hasLayer: jest.fn().mockReturnValue(false),
      addControl: jest.fn().mockReturnThis(),
      removeControl: jest.fn().mockReturnThis(),
      hasControl: jest.fn().mockReturnValue(false),
      fitBounds: jest.fn().mockReturnThis(),
      invalidateSize: jest.fn().mockReturnThis(),
      _container: document.getElementById('routeMap'),
    };
    mockTileLayer = { addTo: jest.fn().mockReturnThis() };
    mockMarker = {
      addTo: jest.fn().mockReturnThis(),
      bindPopup: jest.fn().mockReturnThis(),
      openPopup: jest.fn().mockReturnThis(),
    };
    mockGeoJSON = { addTo: jest.fn().mockReturnThis() };
    mockRoutingControl = { addTo: jest.fn().mockReturnThis() };

    global.L = {
      map: jest.fn(() => mockMap),
      tileLayer: jest.fn(() => mockTileLayer),
      marker: jest.fn(() => mockMarker),
      geoJSON: jest.fn(() => mockGeoJSON),
      routing: { control: jest.fn(() => mockRoutingControl) },
    };

    // Mock Bootstrap Modal
    global.bootstrap = {
      Modal: jest.fn(() => ({
        show: jest.fn(),
        hide: jest.fn(),
      })),
    };

    // Mock fetch
    global.fetch = jest.fn((url) => {
      if (url.includes('nominatim.openstreetmap.org')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { lat: '46.0569', lon: '14.5058', display_name: 'Ljubljana, Slovenia' },
            ]),
        });
      }
      if (url.includes('router.project-osrm.org')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              routes: [
                { distance: 10000, geometry: { type: 'LineString', coordinates: [] } },
              ],
            }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    // Mock console and alert
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    alertSpy = jest.spyOn(window, 'alert').mockImplementation();

    // Mock window.initMap and window.clearMap
    window.initMap = jest.fn(() => {
      window.map = mockMap;
      mockMap.invalidateSize();
    });
    window.clearMap = jest.fn();

    // Ensure DOM is ready
    jest.spyOn(document, 'getElementById').mockImplementation((id) => document.querySelector(`#${id}`));

    // Trigger DOMContentLoaded
    document.dispatchEvent(new Event('DOMContentLoaded'));
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockRestore();
    alertSpy.mockRestore();
    window.map = null;
  });



  


  test('geocodeLocation returns location data', async () => {
    const result = await window.geocodeLocation('Ljubljana');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('nominatim.openstreetmap.org/search?format=json&q=Ljubljana&countrycodes=si&limit=1')
    );
    expect(result).toEqual({
      lat: 46.0569,
      lon: 14.5058,
      displayName: 'Ljubljana, Slovenia',
    });
  });

  test('geocodeLocation handles API errors', async () => {
    global.fetch.mockImplementationOnce(() => Promise.reject(new Error('API error')));
    const result = await window.geocodeLocation('Ljubljana');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Geocoding error:', expect.any(Error));
    expect(result).toBeNull();
  });

  test('getRoute returns route data', async () => {
    const start = { lat: 46.0569, lon: 14.5058 };
    const end = { lat: 46.2397, lon: 14.3556 };
    const result = await window.getRoute(start, end, 'car');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('router.project-osrm.org/route/v1/car/14.5058,46.0569;14.3556,46.2397?overview=full&geometries=geojson')
    );
    expect(result).toEqual({
      distance: 10, // 10000m = 10km
      geometry: { type: 'LineString', coordinates: [] },
    });
  });

  test('getRoute handles routing errors', async () => {
    global.fetch.mockImplementationOnce(() => Promise.reject(new Error('Routing error')));
    const result = await window.getRoute(
      { lat: 46.0569, lon: 14.5058 },
      { lat: 46.2397, lon: 14.3556 },
      'car'
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith('Routing error:', expect.any(Error));
    expect(result).toBeNull();
  });

  

  test('calculateRoute handles missing inputs', async () => {
    document.getElementById('startPoint').value = '';
    document.getElementById('endPoint').value = 'Kranj';
    await window.calculateRoute();
    expect(alertSpy).toHaveBeenCalledWith('Prosim vnesite obe lokaciji');
    expect(fetch).not.toHaveBeenCalled();
  });

  test('calculateRoute handles missing transport mode', async () => {
    document.getElementById('startPoint').value = 'Ljubljana';
    document.getElementById('endPoint').value = 'Kranj';
    document.querySelectorAll('.transport-mode').forEach((btn) => btn.classList.remove('active'));
    await window.calculateRoute();
    expect(alertSpy).toHaveBeenCalledWith('Prosim izberite način prevoza');
    expect(fetch).not.toHaveBeenCalled();
  });


  test('transport mode selection toggles active class', () => {
    const drivingBtn = document.querySelector('.transport-mode[data-mode="driving"]');
    const cyclingBtn = document.querySelector('.transport-mode[data-mode="cycling"]');

    cyclingBtn.click();
    expect(cyclingBtn.classList.contains('active')).toBe(true);
    expect(drivingBtn.classList.contains('active')).toBe(false);

    drivingBtn.click();
    expect(drivingBtn.classList.contains('active')).toBe(true);
    expect(cyclingBtn.classList.contains('active')).toBe(false);
  });

  test('calculator icon click opens modal and resets fields', () => {
    const calculatorIcon = document.querySelector('.fa-calculator').closest('a');
    calculatorIcon.click();

    const modalInstance = bootstrap.Modal.mock.results[0].value;
    expect(modalInstance.show).toHaveBeenCalled();
    expect(document.getElementById('startPoint').value).toBe('');
    expect(document.getElementById('endPoint').value).toBe('');
    expect(document.getElementById('distanceResult').textContent).toBe('-');
    expect(document.getElementById('co2Result').textContent).toBe('-');
    expect(document.getElementById('co2Comparison').innerHTML).toBe('');
    expect(document.querySelector('.transport-mode[data-mode="driving"]').classList.contains('active')).toBe(true);
  });
});