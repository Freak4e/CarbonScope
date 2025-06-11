document.addEventListener('DOMContentLoaded', function() {
  // Get the calculator icon
  const calculatorIcon = document.querySelector('.fa-calculator').closest('a');
  
  // Map variables
  let map;
  let routeLayer;
  let startMarker, endMarker;
  let routingControl;
  let modalInstance = null;
  let scrollPosition = 0;
  
  // CO₂ emission factors (grams per km per passenger)
  const EMISSION_FACTORS = {
    walking: 0,
    cycling: 0,
    driving: 170,
    bus: 68,
    airplane: 250
  };

  // Transport mode names in Slovenian
  const MODE_NAMES = {
    walking: "Hoja",
    cycling: "Kolo",
    driving: "Avto",
    bus: "Avtobus",
    airplane: "Letalo"
  };

  // Motivational messages based on CO₂ emissions
  function getMotivationalMessage(mode, co2) {
    const messages = {
      walking: [
        "Odlično! Hoja je najbolj okolju prijazen način prevoza. 🌿",
        "Hoja je odlična za vaše zdravje in planet! Nadaljujte tako! 💚"
      ],
      cycling: [
        "Kolesarjenje je odličen izbor! Brez emisij in dobro za zdravje. 🚴",
        "Bravo za kolesarjenje! Še vedno najboljši način za kratke razdalje. 👍"
      ],
      driving: [
        `Avto je oddal ${co2}g CO₂. Razmislite o skupnem vožnji ali električnem avtomobilu. 🚗`,
        `Za naslednjič razmislite o javnem prevozu (${co2}g CO₂). 🌱`
      ],
      bus: [
        `Avtobus je boljši izbor kot avto (${co2}g CO₂). Hvala za skrb za okolje! 🚌`,
        "Javni prevoz je ključ do zmanjšanja prometa in emisij. ♻️"
      ],
      airplane: [
        `Letalo je oddal ${co2}g CO₂. Razmislite o alternativah za kratke razdalje. ✈️`,
        "Za krajše razdalje so vlaki pogosto hitrejši in boljši za okolje. 🚆"
      ]
    };

    if (co2 == 0) {
      return "Čestitamo! Nič emisij CO₂. Ohranjate zrak čist! 🌍";
    }

    const modeMessages = messages[mode] || [
      `Vaš prevoz je oddal ${co2}g CO₂. Razmislite o okolju prijaznejših alternativah.`
    ];
    
    return modeMessages[Math.floor(Math.random() * modeMessages.length)];
  }
  
  // Initialize map with error handling
  function initMap() {
    try {
      if (!map || !map._container) {
        const mapContainer = document.getElementById('routeMap');
        if (!mapContainer) {
          console.error('Map container not found');
          return;
        }
        
        map = L.map('routeMap', {
          zoomControl: true,
          attributionControl: true
        }).setView([46.1512, 14.9955], 8);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        }).addTo(map);
      }
      
      setTimeout(() => {
        if (map) map.invalidateSize();
        clearMap();
      }, 0);
    } catch (e) {
      console.error('Map initialization error:', e);
    }
  }
  
  // Clear map elements safely
  function clearMap() {
    try {
      if (!map) return;
      
      if (routeLayer && map.hasLayer(routeLayer)) map.removeLayer(routeLayer);
      if (startMarker && map.hasLayer(startMarker)) map.removeLayer(startMarker);
      if (endMarker && map.hasLayer(endMarker)) map.removeLayer(endMarker);
      if (routingControl && map.hasControl(routingControl)) map.removeControl(routingControl);
      
      routeLayer = null;
      startMarker = null;
      endMarker = null;
      routingControl = null;
    } catch (e) {
      console.error('Error clearing map:', e);
    }
  }
  
  // Show modal handler
  calculatorIcon.addEventListener('click', function() {
    scrollPosition = window.scrollY || document.documentElement.scrollTop;
    
    if (!modalInstance) {
      modalInstance = new bootstrap.Modal(document.getElementById('co2CalculatorModal'), {
        backdrop: true,
        focus: true,
        keyboard: true
      });
    }
    
    // Reset modal content
    document.getElementById('startPoint').value = '';
    document.getElementById('endPoint').value = '';
    document.getElementById('distanceResult').textContent = '-';
    document.getElementById('co2Result').textContent = '-';
    document.getElementById('co2Comparison').innerHTML = '';
    document.querySelectorAll('.transport-mode').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.transport-mode[data-mode="driving"]').classList.add('active');
    
    modalInstance.show();
  });

  // Initialize map when modal is shown
  document.getElementById('co2CalculatorModal').addEventListener('shown.bs.modal', function() {
    initMap();
  });
  
  // Transport mode selection
  const transportModes = document.querySelectorAll('.transport-mode');
  transportModes.forEach(mode => {
    mode.addEventListener('click', function() {
      transportModes.forEach(m => m.classList.remove('active'));
      this.classList.add('active');
    });
  });
  
  // Geocoding function
  async function geocodeLocation(query) {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=si&limit=1`);
      const data = await response.json();
      return data.length > 0 ? {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        displayName: data[0].display_name
      } : null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }
  
  // Routing function
  async function getRoute(start, end, profile) {
    try {
      const response = await fetch(`https://router.project-osrm.org/route/v1/${profile}/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson`);
      const data = await response.json();
      return data.routes?.length > 0 ? {
        distance: data.routes[0].distance / 1000,
        geometry: data.routes[0].geometry
      } : null;
    } catch (error) {
      console.error('Routing error:', error);
      return null;
    }
  }
  
  // Calculate route button
  document.getElementById('calculateBtn').addEventListener('click', calculateRoute);
  
  // Main calculation function
  async function calculateRoute() {
    const startInput = document.getElementById('startPoint').value;
    const endInput = document.getElementById('endPoint').value;
    const selectedMode = document.querySelector('.transport-mode.active')?.dataset.mode;
    const overlay = document.getElementById('calculationOverlay');
    
    if (!startInput || !endInput) {
      alert('Prosim vnesite obe lokaciji');
      return;
    }
    
    if (!selectedMode) {
      alert('Prosim izberite način prevoza');
      return;
    }
    
    document.getElementById('calculateBtn').disabled = true;
    overlay.style.display = 'flex';
    
    try {
      const [start, end] = await Promise.all([
        geocodeLocation(startInput),
        geocodeLocation(endInput)
      ]);
      
      if (!start || !end) {
        throw new Error('Lokacije ni bilo mogoče najti. Prosimo, poskusite z natančnejšim naslovom.');
      }
      
      const profile = {
        walking: 'foot',
        cycling: 'bike',
        driving: 'car',
        bus: 'car',
        airplane: 'car'
      }[selectedMode] || 'car';
      
      const route = await getRoute(start, end, profile);
      if (!route) {
        throw new Error('Poti ni bilo mogoče najti. Prosimo, preverite lokaciji.');
      }
      
      displayRoute(start, end, route.geometry);
      
      const co2Emissions = (route.distance * EMISSION_FACTORS[selectedMode]).toFixed(0);
      document.getElementById('distanceResult').textContent = `${route.distance.toFixed(1)} km`;
      document.getElementById('co2Result').textContent = `${co2Emissions} g CO₂`;
      showMotivationalMessage(selectedMode, co2Emissions);
      
    } catch (error) {
      alert(error.message);
    } finally {
      document.getElementById('calculateBtn').disabled = false;
      overlay.style.display = 'none';
    }
  }
  
  // Display route with error handling
  function displayRoute(start, end, geometry) {
    if (!map) {
      console.error('Cannot display route: map not initialized');
      return;
    }
    
    clearMap();
    
    function getLocationName(displayName) {
      const parts = displayName.split(',');
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i].trim();
        if (!/^\d/.test(part) && part.length > 0) return part;
      }
      return parts[0].trim();
    }
    
    try {
      startMarker = L.marker([start.lat, start.lon]).addTo(map)
        .bindPopup(`<b>Začetek:</b> ${getLocationName(start.displayName)}`)
        .openPopup();
      
      endMarker = L.marker([end.lat, end.lon]).addTo(map)
        .bindPopup(`<b>Konec:</b> ${getLocationName(end.displayName)}`);
      
      routeLayer = L.geoJSON(geometry, {
        style: { color: '#3388ff', weight: 5, opacity: 0.7 }
      }).addTo(map);
      
      map.fitBounds([
        [start.lat, start.lon],
        [end.lat, end.lon]
      ], { padding: [50, 50] });
    } catch (e) {
      console.error('Error displaying route:', e);
    }
  }
  
  // Show motivational message
  function showMotivationalMessage(mode, co2) {
    const message = getMotivationalMessage(mode, co2);
    let alertClass = co2 == 0 ? 'alert-success' : co2 > 150 ? 'alert-warning' : 'alert-info';
    const iconClass = co2 == 0 ? 'fa-leaf' : co2 < 100 ? 'fa-bus' : 'fa-car';
    
    document.getElementById('co2Comparison').innerHTML = `
      <div class="mt-3 alert ${alertClass}">
        <i class="fas ${iconClass} me-2"></i>
        ${message}
      </div>
    `;
  }

  // Modal hidden handler
  document.getElementById('co2CalculatorModal').addEventListener('hidden.bs.modal', function() {
    clearMap();
    
    // Clean up Bootstrap modal artifacts
    setTimeout(() => {
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach(backdrop => backdrop.remove());
      
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      
      window.scrollTo(0, scrollPosition);
    }, 50);
  });

  window.geocodeLocation = geocodeLocation;
  window.getRoute = getRoute;
  window.calculateRoute = calculateRoute;
  window.displayRoute = displayRoute;
  window.getMotivationalMessage = getMotivationalMessage;
});