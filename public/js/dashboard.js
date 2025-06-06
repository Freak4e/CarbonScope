document.addEventListener('DOMContentLoaded', function() {
  // Chart instances
  let totalEmissionsChart, globalShareChart;
  // Store data for CSV downloads
  let topCountriesData = [];

  // Initialize dashboard when tab content is loaded
  function initDashboard() {
    // Check if required elements exist
    if (!document.getElementById('totalEmissionsChart') && !document.getElementById('globalShareChart')) {
      console.log('No overview dashboard elements found, skipping initialization');
      return;
    }

    // Initialize charts
    initTopCountriesCharts();
    updateTopCountriesCharts();
  }

  function initTopCountriesCharts() {
    const totalEmissionsCanvas = document.getElementById('totalEmissionsChart');
    if (!totalEmissionsCanvas) {
      console.error('Total Emissions chart canvas not found');
      return;
    }
    const totalEmissionsCtx = totalEmissionsCanvas.getContext('2d');
    totalEmissionsChart = new Chart(totalEmissionsCtx, {
      type: 'line',
      data: { labels: [], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, padding: 10 } },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.raw.toFixed(2)} billion tonnes`;
              }
            }
          },
          afterDraw: function(chart) {
            const ctx = chart.ctx;
            chart.data.datasets.forEach((dataset, i) => {
              const meta = chart.getDatasetMeta(i);
              if (!meta.hidden) {
                const lastPoint = meta.data[meta.data.length - 1];
                if (lastPoint) {
                  const x = lastPoint.x + 5;
                  const y = lastPoint.y;
                  ctx.save();
                  ctx.font = '12px Arial';
                  ctx.fillStyle = dataset.borderColor;
                  ctx.fillText(dataset.label, x, y);
                  ctx.restore();
                }
              }
            });
          }
        },
        scales: {
          y: { title: { display: true, text: 'CO₂ Emissions (billion tonnes)' }, beginAtZero: true, suggestedMax: 20 },
          x: { title: { display: true, text: 'Year' } }
        },
        interaction: { intersect: false, mode: 'index' },
        elements: { point: { radius: 0 } }
      }
    });
    console.log('Total Emissions Chart initialized');

    const globalShareCanvas = document.getElementById('globalShareChart');
    if (!globalShareCanvas) {
      console.error('Global Share chart canvas not found');
      return;
    }
    const globalShareCtx = globalShareCanvas.getContext('2d');
    globalShareChart = new Chart(globalShareCtx, {
      type: 'line',
      data: { labels: [], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, padding: 10 } },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.raw.toFixed(2)}%`;
              }
            }
          },
          afterDraw: function(chart) {
            const ctx = chart.ctx;
            chart.data.datasets.forEach((dataset, i) => {
              const meta = chart.getDatasetMeta(i);
              if (!meta.hidden) {
                const lastPoint = meta.data[meta.data.length - 1];
                if (lastPoint) {
                  const x = lastPoint.x + 5;
                  const y = lastPoint.y;
                  ctx.save();
                  ctx.font = '12px Arial';
                  ctx.fillStyle = dataset.borderColor;
                  ctx.fillText(dataset.label, x, y);
                  ctx.restore();
                }
              }
            });
          }
        },
        scales: {
          y: { title: { display: true, text: 'Share of Global CO₂ Emissions (%)' }, beginAtZero: true, suggestedMax: 100 },
          x: { title: { display: true, text: 'Year' } }
        },
        interaction: { intersect: false, mode: 'index' },
        elements: { point: { radius: 0 } }
      }
    });
    console.log('Global Share Chart initialized');
  }

  async function updateTopCountriesCharts() {
    try {
      console.log('Fetching data for top countries charts...');
      const response = await fetch('/api/top_countries?startYear=1750&endYear=2023');
      if (!response.ok) throw new Error(`Network response was not ok: ${response.status}`);
      const { data, countries } = await response.json();
      console.log('Data fetched:', { data, countries });

      // Store data for CSV downloads, filtering out invalid entries
      topCountriesData = data.filter(row => row.year != null && row.country != null && (row.co2 != null || row.share_global_co2 != null));

      const years = [...new Set(data.map(d => d.year))].sort((a, b) => a - b);
      const totalEmissionsDatasets = countries.map(country => {
        const countryData = data.filter(d => d.country === country);
        return {
          label: country,
          data: years.map(year => {
            const record = countryData.find(d => d.year === year);
            return record ? record.co2 : 0;
          }),
          borderColor: getRandomColor(),
          backgroundColor: 'transparent',
          borderWidth: 2,
          fill: false,
          tension: 0.1
        };
      });

      if (totalEmissionsChart) {
        totalEmissionsChart.data.labels = years;
        totalEmissionsChart.data.datasets = totalEmissionsDatasets;
        totalEmissionsChart.update();
        console.log('Total Emissions Chart updated with', totalEmissionsDatasets.length, 'datasets');
      } else {
        console.error('totalEmissionsChart not initialized');
      }

      const globalShareDatasets = countries.map(country => {
        const countryData = data.filter(d => d.country === country);
        return {
          label: country,
          data: years.map(year => {
            const record = countryData.find(d => d.year === year);
            return record ? record.share_global_co2 : 0;
          }),
          borderColor: getRandomColor(),
          backgroundColor: 'transparent',
          borderWidth: 2,
          fill: false,
          tension: 0.1
        };
      });

      if (globalShareChart) {
        globalShareChart.data.labels = years;
        globalShareChart.data.datasets = globalShareDatasets;
        globalShareChart.update();
        console.log('Global Share Chart updated with', globalShareDatasets.length, 'datasets');
      } else {
        console.error('globalShareChart not initialized');
      }
    } catch (error) {
      console.error('Error updating top countries charts:', error);
      if (totalEmissionsChart) {
        totalEmissionsChart.data.labels = [];
        totalEmissionsChart.data.datasets = [];
        totalEmissionsChart.update();
      }
      if (globalShareChart) {
        globalShareChart.data.labels = [];
        globalShareChart.data.datasets = [];
        globalShareChart.update();
      }
    }
  }

  // Function to generate and download CSV
  function downloadCSV(data, filename, headers, rowFormatter) {
    // Log data for debugging
    console.log('Generating CSV for:', filename, 'Data:', data);

    // Convert data to CSV format
    let csvContent = headers.join(',') + '\n';
    data.forEach(row => {
      try {
        csvContent += rowFormatter(row) + '\n';
      } catch (error) {
        console.warn('Skipping invalid row:', row, 'Error:', error);
      }
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

  // Download handlers for top countries charts
  window.downloadTotalEmissionsCSV = function() {
    if (topCountriesData.length === 0) {
      alert('Podatki še niso naloženi. Počakajte trenutek in poskusite znova.');
      return;
    }
    downloadCSV(
      topCountriesData,
      'total_co2_emissions.csv',
      ['Year', 'Country', 'CO2_Emissions_Billion_Tonnes'],
      row => `${row.year},${row.country},${row.co2 != null ? row.co2.toFixed(4) : '0.0000'}`
    );
  };

  window.downloadGlobalShareCSV = function() {
    if (topCountriesData.length === 0) {
      alert('Podatki še niso naloženi. Počakajte trenutek in poskusite znova.');
      return;
    }
    downloadCSV(
      topCountriesData,
      'global_share_co2_emissions.csv',
      ['Year', 'Country', 'Share_Global_CO2_Percent'],
      row => `${row.year},${row.country},${row.share_global_co2 != null ? row.share_global_co2.toFixed(2) : '0.00'}`
    );
  };

  function getRandomColor() {
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  }

  // Listen for tab content loaded event
  document.getElementById('tabContent')?.addEventListener('tabContentLoaded', function(e) {
    if (e.detail.tab === 'overview-svet.html') {
      initDashboard();
    }
  });

  // Initialize if already on the overview tab
  if (document.getElementById('totalEmissionsChart') || document.getElementById('globalShareChart')) {
    initDashboard();
  }
});