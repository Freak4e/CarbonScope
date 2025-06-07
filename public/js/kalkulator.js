document.addEventListener('DOMContentLoaded', function() {
  // Get the calculator icon
  const calculatorIcon = document.querySelector('.fa-calculator').closest('a');
  
  // Map variables
  let map;
  let routeLayer;
  let startMarker, endMarker;
  let routingControl;
  
  // CO₂ emission factors (grams per km per passenger)
  const EMISSION_FACTORS = {
    walking: 0,
    cycling: 0,
    driving: 170,   // Average petrol car (ICCT data)
    bus: 68,       // Average diesel bus (EEA data)
    airplane: 250  // Average short-haul flight
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

    // Special messages for zero emissions
    if (co2 == 0) {
      return "Čestitamo! Nič emisij CO₂. Ohranjate zrak čist! 🌍";
    }

    // Get random message for the mode
    const modeMessages = messages[mode] || [
      `Vaš prevoz je oddal ${co2}g CO₂. Razmislite o okolju prijaznejših alternativah.`
    ];
    
    return modeMessages[Math.floor(Math.random() * modeMessages.length)];
  }
  
  // Initialize map
  function initMap() {
    if (!map) {
      map = L.map('routeMap', {
        zoomControl: true,
        attributionControl: true
      }).setView([46.1512, 14.9955], 8); // Center on Slovenia
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);
    }
    
    // Ensure map size is recalculated
    setTimeout(() => {
      map.invalidateSize();
      clearMap();
    }, 0);
  }
  
  // Clear map elements
  function clearMap() {
    if (routeLayer) map.removeLayer(routeLayer);
    if (startMarker) map.removeLayer(startMarker);
    if (endMarker) map.removeLayer(endMarker);
    if (routingControl) map.removeControl(routingControl);
    routeLayer = null;
    startMarker = null;
    endMarker = null;
    routingControl = null;
  }
  
  // Show modal and initialize map when fully shown
  calculatorIcon.addEventListener('click', function() {
    const modal = new bootstrap.Modal(document.getElementById('co2CalculatorModal'));
    modal.show();
  });

  // Initialize map when modal is fully shown
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
  
  // Geocoding using Nominatim (OpenStreetMap)
  async function geocodeLocation(query) {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=si&limit=1`);
      const data = await response.json();
      if (data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
          displayName: data[0].display_name
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }
  
  // Routing using OSRM
  async function getRoute(start, end, profile) {
    try {
      const response = await fetch(`https://router.project-osrm.org/route/v1/${profile}/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson`);
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        return {
          distance: data.routes[0].distance / 1000, // Convert to km
          geometry: data.routes[0].geometry
        };
      }
      return null;
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
      // Geocode both locations
      const start = await geocodeLocation(startInput);
      const end = await geocodeLocation(endInput);
      
      if (!start || !end) {
        throw new Error('Lokacije ni bilo mogoče najti. Prosimo, poskusite z natančnejšim naslovom.');
      }
      
      // Get OSRM profile based on transport mode
      let profile;
      switch(selectedMode) {
        case 'walking': profile = 'foot'; break;
        case 'cycling': profile = 'bike'; break;
        case 'bus': 
        case 'driving': 
        case 'airplane': profile = 'car'; break; // Using car profile as fallback for airplane
        default: profile = 'car';
      }
      
      // Get route
      const route = await getRoute(start, end, profile);
      if (!route) {
        throw new Error('Poti ni bilo mogoče najti. Prosimo, preverite lokaciji.');
      }
      
      // Display route on map
      displayRoute(start, end, route.geometry);
      
      // Calculate CO₂ emissions
      const co2Emissions = (route.distance * EMISSION_FACTORS[selectedMode]).toFixed(0);
      
      // Update results
      document.getElementById('distanceResult').textContent = `${route.distance.toFixed(1)} km`;
      document.getElementById('co2Result').textContent = `${co2Emissions} g CO₂`;
      
      // Show motivational message
      showMotivationalMessage(selectedMode, co2Emissions);
      
    } catch (error) {
      alert(error.message);
    } finally {
      document.getElementById('calculateBtn').disabled = false;
      overlay.style.display = 'none';
    }
  }
  
  // Display route on map
  function displayRoute(start, end, geometry) {
    clearMap();
    
    // Helper function to extract the most relevant name (street or place)
    function getLocationName(displayName) {
      const parts = displayName.split(',');
      // Typically, the street or place name is the first or second part
      // Skip numeric parts (like house numbers) and return the first non-numeric part
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i].trim();
        if (!/^\d/.test(part) && part.length > 0) {
          return part;
        }
      }
      return parts[0].trim(); // Fallback to first part if no suitable name found
    }
    
    // Add markers
    startMarker = L.marker([start.lat, start.lon]).addTo(map)
      .bindPopup(`<b>Začetek:</b> ${getLocationName(start.displayName)}`)
      .openPopup();
    
    endMarker = L.marker([end.lat, end.lon]).addTo(map)
      .bindPopup(`<b>Konec:</b> ${getLocationName(end.displayName)}`);
    
    // Add route
    routeLayer = L.geoJSON(geometry, {
      style: {
        color: '#3388ff',
        weight: 5,
        opacity: 0.7
      }
    }).addTo(map);
    
    // Fit bounds
    map.fitBounds([
      [start.lat, start.lon],
      [end.lat, end.lon]
    ], { padding: [50, 50] });
  }
  
  // Show motivational message instead of comparison
  function showMotivationalMessage(mode, co2) {
    const message = getMotivationalMessage(mode, co2);
    let alertClass = 'alert-info';
    
    if (co2 == 0) {
      alertClass = 'alert-success';
    } else if (co2 > 150) {
      alertClass = 'alert-warning';
    }
    
    document.getElementById('co2Comparison').innerHTML = `
      <div class="mt-3 alert ${alertClass}">
        <i class="fas ${co2 == 0 ? 'fa-leaf' : co2 < 100 ? 'fa-bus' : 'fa-car'} me-2"></i>
        ${message}
      </div>
    `;
  }

  // Reset modal when closed
  document.getElementById('co2CalculatorModal').addEventListener('hidden.bs.modal', function() {
    // Clear input fields
    document.getElementById('startPoint').value = '';
    document.getElementById('endPoint').value = '';
    
    // Reset results
    document.getElementById('distanceResult').textContent = '-';
    document.getElementById('co2Result').textContent = '-';
    document.getElementById('co2Comparison').innerHTML = '';
    
    // Clear the map
    clearMap();
    
    // Reset transport mode (no active selection)
    document.querySelectorAll('.transport-mode').forEach(btn => {
      btn.classList.remove('active');
    });
  });
});