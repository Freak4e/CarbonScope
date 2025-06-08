document.addEventListener('DOMContentLoaded', function () {
  // Global variables to store chart data
  let globalEmissionsData = [];
  let sloveniaEmissionsData = [];

  // Function to fetch and process data for global emissions chart
  async function loadGlobalEmissionsChart() {
    try {
      const response = await fetch('/api/global-emissions?startYear=2000&endYear=2100');
      const data = await response.json();
      
      // Store data for CSV download
      globalEmissionsData = data;

      // Separate historical (≤2023) and predicted (≥2023) data
      const historicalData = data.filter(d => d.year <= 2023);
      const predictedData = data.filter(d => d.year >= 2023);

      // Chart.js configuration for global emissions
      const ctx = document.getElementById('futureEmissionsLongTermChart').getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          datasets: [
            {
              label: 'CO₂ emisije', // Historical data
              data: historicalData.map(d => ({ x: d.year, y: d.co2 })),
              borderColor: '#5e72e4',
              backgroundColor: 'rgba(94, 114, 228, 0.1)',
              fill: false,
              tension: 0.1,
              pointRadius: 0,
            },
            {
              label: 'Najverjetneje', // Predicted data
              data: predictedData.map(d => ({ x: d.year, y: d.co2 })),
              borderColor: '#f39c12', // Orange for predicted
              backgroundColor: 'rgba(243, 156, 18, 0.1)',
              fill: false,
              tension: 0.1,
              pointRadius: 0,
            },
            {
              label: 'Zgornja meja',
              data: predictedData.map(d => ({ x: d.year, y: d.upper_bound })),
              borderColor: 'rgba(255, 99, 132, 0.5)',
              backgroundColor: 'rgba(255, 99, 132, 0.1)',
              fill: '+1',
              tension: 0.1,
              pointRadius: 0,
              borderDash: [5, 5],
            },
            {
              label: 'Spodnja meja',
              data: predictedData.map(d => ({ x: d.year, y: d.lower_bound })),
              borderColor: 'rgba(75, 192, 192, 0.5)',
              backgroundColor: 'rgba(75, 192, 192, 0.1)',
              fill: false,
              tension: 0.1,
              pointRadius: 0,
              borderDash: [5, 5],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              type: 'linear',
              title: { display: true, text: 'Year' },
              min: 2000,
              max: 2100,
              ticks: {
                callback: function(value) {
                  return Math.floor(value);
                },
              },
            },
            y: {
              title: { display: true, text: 'CO₂ Emisije (Gt)' },
              beginAtZero: false,
            },
          },
          plugins: {
            legend: { display: true },
            tooltip: {
              enabled: true,
              mode: 'nearest',
              intersect: false,
              callbacks: {
                title: function(tooltipItems) {
                  const year = Math.floor(tooltipItems[0].parsed.x);
                  return `Year: ${year}`;
                },
                label: function(context) {
                  const year = Math.floor(context.parsed.x);
                  const datasetLabel = context.dataset.label || '';
                  let label = `${datasetLabel}: ${context.parsed.y.toFixed(2)} Gt`;

                  if (year >= 2023 && context.datasetIndex <= 1) { // Handle "Najverjetneje" and historical for predicted years
                    const dataPoint = context.chart.data.datasets[1].data.find(d => d.x === year); // Predicted CO2
                    const upperBound = context.chart.data.datasets[2].data.find(d => d.x === year);
                    const lowerBound = context.chart.data.datasets[3].data.find(d => d.x === year);
                    if (context.datasetIndex === 1) { // Only for "Najverjetneje"
                      return [
                        `Najverjetneje: ${dataPoint.y.toFixed(2)} Gt`,
                        `Zgornja meja: ${upperBound.y.toFixed(2)} Gt`,
                        `Spodnja meja: ${lowerBound.y.toFixed(2)} Gt`
                      ];
                    }
                    return null; // Skip historical dataset tooltip for years ≥2023
                  }
                  return label;
                },
              },
            },
            annotation: {
              annotations: {
                line2023: {
                  type: 'line',
                  xMin: 2023,
                  xMax: 2023,
                  borderColor: 'rgba(0, 0, 0, 0.5)',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  label: {
                    content: '2023',
                    enabled: true,
                    position: 'top',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    color: '#fff',
                  },
                },
              },
            },
          },
        },
      });
    } catch (error) {
      console.error('Error loading global emissions chart:', error);
    }
  }

  // Function to fetch and process data for Slovenia emissions chart
  async function loadSloveniaEmissionsChart() {
    try {
      const response = await fetch('/api/slovenia-emissions?startYear=2000&endYear=2100');
      const data = await response.json();
      
      // Store data for CSV download
      sloveniaEmissionsData = data;

      // Separate historical (≤2023) and predicted (≥2023) data
      const historicalData = data.filter(d => d.year <= 2023);
      const predictedData = data.filter(d => d.year >= 2023);

      // Chart.js configuration for Slovenia emissions
      const ctx = document.getElementById('sloveniaEmissionsChart').getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          datasets: [
            {
              label: 'CO₂ emisije', // Historical data
              data: historicalData.map(d => ({ x: d.year, y: d.co2 })),
              borderColor: '#5e72e4',
              backgroundColor: 'rgba(94, 114, 228, 0.1)',
              fill: false,
              tension: 0.1,
              pointRadius: 0,
            },
            {
              label: 'Najverjetneje', // Predicted data
              data: predictedData.map(d => ({ x: d.year, y: d.co2 })),
              borderColor: '#f39c12', // Orange for predicted
              backgroundColor: 'rgba(243, 156, 18, 0.1)',
              fill: false,
              tension: 0.1,
              pointRadius: 0,
            },
            {
              label: 'Zgornja meja',
              data: predictedData.map(d => ({ x: d.year, y: d.upper_bound })),
              borderColor: 'rgba(255, 99, 132, 0.5)',
              backgroundColor: 'rgba(255, 99, 132, 0.1)',
              fill: '+1',
              tension: null,
              pointRadius: 0,
              borderDash: [5, 5],
            },
            {
              label: 'Spodnja meja',
              data: predictedData.map(d => ({ x: d.year, y: d.lower_bound })),
              borderColor: 'rgba(75, 192, 192, 0.5)',
              backgroundColor: 'rgba(75, 192, 192, 0.1)',
              fill: false,
              tension: 0.1,
              pointRadius: 0,
              borderDash: [5, 5],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              type: 'linear',
              title: { display: true, text: 'Year' },
              min: 2000,
              max: 2100,
              ticks: {
                callback: function(value) {
                  return Math.floor(value);
                },
              },
            },
            y: {
              title: { display: true, text: 'CO₂ Emisije (Gt)' },
              beginAtZero: true,
            },
            tension: 0.1,
          },
          plugins: {
            legend: { display: true },
            tooltip: {
              enabled: true,
              mode: 'nearest',
              intersect: false,
              callbacks: {
                title: function(tooltipItems) {
                  const year = Math.floor(tooltipItems[0].parsed.x);
                  return `Year: ${year}`;
                },
                label: function(context) {
                  const year = Math.floor(context.parsed.x);
                  const datasetLabel = context.dataset.label || '';
                  let label = `${datasetLabel}: ${context.parsed.y.toFixed(4)} Gt`;

                  if (year >= 2023 && context.datasetIndex <= 1) { // Handle "Najverjetneje" and historical for predicted years
                    const dataPoint = context.chart.data.datasets[1].data.find(d => d.x === year); // Predicted CO2
                    const upperBound = context.chart.data.datasets[2].data.find(d => d.x === year);
                    const lowerBound = context.chart.data.datasets[3].data.find(d => d.x === year);
                    if (context.datasetIndex === 1) { // Only for "Najverjetneje"
                      return [
                        `Najverjetneje: ${dataPoint.y.toFixed(4)} Gt`,
                        `Zgornja meja: ${upperBound.y.toFixed(4)} Gt`,
                        `Spodnja meja: ${lowerBound.y.toFixed(4)} Gt`
                      ];
                    }
                    return null; // Skip historical dataset tooltip for years ≥2023
                  }
                  return label;
                },
              },
            },
            annotation: {
              annotations: {
                line2023: {
                  type: 'line',
                  xMin: 2023,
                  xMax: 2023,
                  borderColor: 'rgba(0, 0, 0, 0.5)',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  label: {
                    content: '2023',
                    enabled: true,
                    position: 'top',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    color: '#fff',
                  },
                },
              },
            },
          },
        },
      });
    } catch (error) {
      console.error('Error loading Slovenia emissions chart:', error);
    }
  }

  // Function to generate and download CSV
  function downloadCSV(data, filename, isSlovenia = false) {
    // Convert data to CSV format with Slovenian headers
    let csvContent = 'Leto,Emisije_CO2,Zgornja_Meja,Spodnja_Meja\n';
    data.forEach(row => {
      // For Slovenia, convert Gt back to Mt for user-friendly output
      const co2 = isSlovenia ? (row.co2 * 1000).toFixed(4) : row.co2.toFixed(2);
      const upper = isSlovenia ? (row.upper_bound * 1000).toFixed(4) : row.upper_bound.toFixed(2);
      const lower = isSlovenia ? (row.lower_bound * 1000).toFixed(4) : row.lower_bound.toFixed(2);
      csvContent += `${row.year},${co2},${upper},${lower}\n`;
    });

    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Create a temporary link element to trigger download
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Download handlers for each chart
  window.downloadGlobalCSV = function() {
    if (globalEmissionsData.length === 0) {
      alert('Podatki še niso naloženi. Počakajte trenutek in poskusite znova.');
      return;
    }
    downloadCSV(globalEmissionsData, 'globalne_emisije_co2.csv');
  };

  window.downloadSloveniaCSV = function() {
    if (sloveniaEmissionsData.length === 0) {
      alert('Podatki še niso naloženi. Počakajte trenutek in poskusite znova.');
      return;
    }
    downloadCSV(sloveniaEmissionsData, 'slovenija_emisije_co2.csv', true);
  };

  // Initialize both charts
  loadGlobalEmissionsChart();
  loadSloveniaEmissionsChart();

  // Navigation event listeners for sidebar
  const svetSubLinks = document.querySelectorAll('#svetSubmenu .nav-link');
  const slovenijaSubLinks = document.querySelectorAll('#slovenijaSubmenu .nav-link');

  svetSubLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const href = this.getAttribute('href');
      window.location.assign(href);
    });
  });

  slovenijaSubLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const href = this.getAttribute('href');
      window.location.href = href;
    });
  });
});