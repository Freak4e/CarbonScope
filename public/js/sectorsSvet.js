document.addEventListener('DOMContentLoaded', function() {
  // Chart instances for Sectors tab
  let sectorChart, sectorLineChart, globalSectorChart;

  // DOM elements
  const unifiedCountrySelect = $('#unifiedCountrySelect');

  // Initialize Sectors tab
  initSectorsTab();

  async function initSectorsTab() {
    // Initialize Select2 dropdown for unifiedCountrySelect
    if (unifiedCountrySelect.length) {
      unifiedCountrySelect.select2({
        placeholder: "Izberi državo...",
        allowClear: true,
        width: '25%'
      });
    } else {
      console.warn('unifiedCountrySelect element not found');
      return;
    }

    // Load countries and set default to World
    await loadCountries();

    // Initialize charts for Sectors tab
    initSectorCharts();

    // Set default selection to World and trigger updates
    try {
      unifiedCountrySelect.val('World').trigger('select2:select');
      await updateAllSectorCharts('World');
    } catch (error) {
      console.error('Error setting default to World:', error);
    }

    // Add change handler for unified country select
    unifiedCountrySelect.on('change', async function() {
      const country = $(this).val();
      if (!country) {
        // Clear all three charts if no country is selected
        clearAllCharts();
        return;
      }
      await updateAllSectorCharts(country);
    });
  }

  async function loadCountries() {
    try {
      const response = await fetch('/api/countries');
      if (!response.ok) throw new Error('Network response was not ok');
      const countries = await response.json();

      if (unifiedCountrySelect.length) {
        unifiedCountrySelect.empty();
        unifiedCountrySelect.append(new Option("Izberi državo", ""));
        countries.forEach(country => {
          if (!['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'].includes(country)) {
            unifiedCountrySelect.append(new Option(country, country));
          }
        });
        console.log('Countries loaded successfully');
      }
    } catch (error) {
      console.error('Error loading countries:', error);
    }
  }

  function initSectorCharts() {
    const sectorCanvas = document.getElementById('sectorChart');
    if (sectorCanvas) {
      const sectorCtx = sectorCanvas.getContext('2d');
      sectorChart = new Chart(sectorCtx, {
        type: 'pie',
        data: { labels: [], datasets: [] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                boxWidth: 50,
                padding: 10,
                font: { size: 12 }
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.label}: ${context.raw.toFixed(2)} million tonnes`;
                }
              }
            },
            title: {
              display: true,
              text: 'Izberi državo za prikaz emisij po sektorjih',
              font: { size: 16 }
            }
          }
        }
      });
    } else {
      console.warn('Sector chart canvas not found');
    }

    const sectorLineCanvas = document.getElementById('sectorLineChart');
    if (sectorLineCanvas) {
      const sectorLineCtx = sectorLineCanvas.getContext('2d');
      sectorLineChart = new Chart(sectorLineCtx, {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { boxWidth: 12, padding: 20 } },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: ${context.raw.toFixed(2)} million tonnes`;
                }
              }
            },
            title: {
              display: true,
              text: 'Izberi državo za prikaz trendov po sektorjih',
              font: { size: 16 }
            }
          },
          scales: {
            y: { title: { display: true, text: 'CO₂ Emissions (million tonnes)' }, beginAtZero: true },
            x: { title: { display: true, text: 'Leto' } }
          },
          interaction: { intersect: false, mode: 'index' }
        }
      });
    } else {
      console.warn('Sector line chart canvas not found');
    }

    const globalSectorCanvas = document.getElementById('globalSectorChart');
    if (globalSectorCanvas) {
      const globalSectorCtx = globalSectorCanvas.getContext('2d');
      globalSectorChart = new Chart(globalSectorCtx, {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { boxWidth: 12, padding: 20 } },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: ${context.raw.toFixed(2)} million tonnes`;
                }
              }
            },
            title: {
              display: true,
              text: 'Izberi državo za prikaz globalnih emisij po sektorjih',
              font: { size: 16 }
            }
          },
          scales: {
            y: { title: { display: true, text: 'CO₂ Emissions (million tonnes)' }, beginAtZero: true },
            x: { title: { display: true, text: 'Leto' } }
          },
          interaction: { intersect: false, mode: 'index' },
          elements: {
            line: { borderWidth: 2, tension: 0.1 },
            point: { radius: 3, hoverRadius: 5 }
          }
        }
      });
    } else {
      console.warn('Global sector chart canvas not found');
    }
  }

  async function updateAllSectorCharts(country) {
    await Promise.all([
      updateSectorChart(country, 2022),
      updateSectorLineChart(country),
      updateGlobalSectorChart(country)
    ]);
  }

  async function updateSectorChart(country, year) {
    if (!sectorChart) return;

    try {
      const response = await fetch(`/api/sectors/${encodeURIComponent(country)}?year=${year}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const sectorData = await response.json();

      const sectorLabels = Object.keys(sectorData.sectors).map(s =>
        s.replace(/_co2$/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      );

      sectorChart.data.labels = sectorLabels;
      sectorChart.data.datasets = [{
        data: Object.values(sectorData.sectors),
        backgroundColor: ['#FF6384', '#36A2EB', '#4BC0C0', '#FFCE56', '#9966FF', '#FF9F40'],
        borderColor: '#fff',
        borderWidth: 1
      }];

      sectorChart.options.plugins.title.text = `Emisije CO₂ po sektorjih v ${country} (${year})`;
      sectorChart.update();
      console.log(`Sector chart updated for ${country}`);
    } catch (error) {
      console.error(`Error loading sector data for ${country}:`, error);
      sectorChart.data.labels = [];
      sectorChart.data.datasets = [];
      sectorChart.options.plugins.title.text = `Podatki za ${country} niso na voljo`;
      sectorChart.update();
    }
  }

  async function updateSectorLineChart(country) {
    if (!sectorLineChart) return;

    try {
      const emissionsResponse = await fetch(`/api/emissions?country=${encodeURIComponent(country)}&startYear=1990&endYear=2022`);
      if (!emissionsResponse.ok) throw new Error('Network response was not ok');
      const emissionsData = await emissionsResponse.json();

      if (!emissionsData || emissionsData.length === 0) {
        throw new Error('No data returned from API');
      }

      const sectorDataPromises = emissionsData.map(async (yearData) => {
        const response = await fetch(`/api/sectors/${encodeURIComponent(country)}?year=${yearData.year}`);
        return response.json();
      });
      const sectorData = await Promise.all(sectorDataPromises);
      const combinedData = emissionsData.map((yearData, index) => ({
        year: yearData.year,
        ...sectorData[index].sectors
      }));

      const sectors = [
        { key: 'coal_co2', label: 'Premog', color: '#FF6384' },
        { key: 'oil_co2', label: 'Nafta', color: '#36A2EB' },
        { key: 'gas_co2', label: 'Plin', color: '#4BC0C0' },
        { key: 'cement_co2', label: 'Cement', color: '#FFCE56' },
        { key: 'flaring_co2', label: 'Sežiganje', color: '#9966FF' },
        { key: 'other_co2', label: 'Drugo', color: '#FF9F40' }
      ];

      const datasets = sectors.map(sector => ({
        label: sector.label,
        data: combinedData.map(item => item[sector.key] || 0),
        borderColor: sector.color,
        backgroundColor: 'transparent',
        borderWidth: 2,
        fill: false,
        tension: 0.1
      }));

      sectorLineChart.data.labels = combinedData.map(item => item.year);
      sectorLineChart.data.datasets = datasets;
      sectorLineChart.options.plugins.title.text = `Trendi emisij CO₂ po sektorjih v ${country} (1990-2022)`;
      sectorLineChart.update();
      console.log(`Sector line chart updated for ${country}`);
    } catch (error) {
      console.error(`Error loading sector line data for ${country}:`, error);
      sectorLineChart.data.labels = [];
      sectorLineChart.data.datasets = [];
      sectorLineChart.options.plugins.title.text = `Podatki za ${country} niso na voljo`;
      sectorLineChart.update();
    }
  }

async function updateGlobalSectorChart(country) {
  if (!globalSectorChart) return;

  try {
    const response = await fetch(`/api/sector-emissions?entity=${encodeURIComponent(country)}&year=1990:2021`);
    if (!response.ok) throw new Error(`Network response was not ok: ${response.status}`);
    const sectorData = await response.json();

    if (!sectorData || sectorData.length === 0) {
      throw new Error('No data returned from API');
    }

    console.log(`Sector data for ${country}:`, sectorData);

    // Extract available years from the data (instead of hardcoding)
    const availableYears = sectorData.map(d => parseInt(d.Year)).sort((a, b) => a - b);
    
    const sectors = [
      { key: 'Carbon dioxide emissions from buildings', label: 'Zgradbe', color: '#FF6384' },
      { key: 'Carbon dioxide emissions from industry', label: 'Industrija', color: '#36A2EB' },
      { key: 'Carbon dioxide emissions from land use change and forestry', label: 'Spremembe rabe zemljišč in gozdarstvo', color: '#4BC0C0' },
      { key: 'Carbon dioxide emissions from other fuel combustion', label: 'Druga goriva', color: '#FFCE56' },
      { key: 'Carbon dioxide emissions from transport', label: 'Promet', color: '#9966FF' },
      { key: 'Carbon dioxide emissions from manufacturing and construction', label: 'Proizvodnja in gradbeništvo', color: '#FF9F40' },
      { key: 'Fugitive emissions of carbon dioxide from energy production', label: 'Fugitivne emisije iz energetike', color: '#E7E9ED' },
      { key: 'Carbon dioxide emissions from electricity and heat', label: 'Elektrika in toplota', color: '#36A2EB' },
      { key: 'Carbon dioxide emissions from bunker fuels', label: 'Bunker goriva', color: '#F7464A' }
    ];

    const datasets = sectors.map(sector => {
      const data = availableYears.map(year => {
        const record = sectorData.find(d => parseInt(d.Year) === year);
        // Handle empty strings or non-numeric values
        const value = record && record[sector.key] ? parseFloat(record[sector.key]) : null;
        return isNaN(value) ? null : value / 1000000; // Convert to million tonnes
      });
      return {
        label: sector.label,
        data,
        borderColor: sector.color,
        backgroundColor: 'transparent',
        borderWidth: 2,
        fill: false,
        tension: 0.1,
        pointRadius: 3,
        pointHoverRadius: 5,
        spanGaps: true // Connect lines across missing data
      };
    });

    globalSectorChart.data.labels = availableYears;
    globalSectorChart.data.datasets = datasets;
    globalSectorChart.options.plugins.title.text = `Globalne emisije CO₂ po sektorjih v ${country} (${availableYears[0]}-${availableYears[availableYears.length-1]})`;
    globalSectorChart.update();
    console.log(`Global sector chart updated for ${country} with ${datasets.length} datasets`);
  } catch (error) {
    console.error(`Error loading global sector data for ${country}:`, error);
    globalSectorChart.data.labels = [];
    globalSectorChart.data.datasets = [];
    globalSectorChart.options.plugins.title.text = `Podatki za ${country} niso na voljo`;
    globalSectorChart.update();
  }
}

  function clearAllCharts() {
    if (sectorChart) {
      sectorChart.data.datasets = [];
      sectorChart.options.plugins.title.text = 'Izberi državo za prikaz emisij po sektorjih';
      sectorChart.update();
    }
    if (sectorLineChart) {
      sectorLineChart.data.labels = [];
      sectorLineChart.data.datasets = [];
      sectorLineChart.options.plugins.title.text = 'Izberi državo za prikaz trendov po sektorjih';
      sectorLineChart.update();
    }
    if (globalSectorChart) {
      globalSectorChart.data.labels = [];
      globalSectorChart.data.datasets = [];
      globalSectorChart.options.plugins.title.text = 'Izberi državo za prikaz globalnih emisij po sektorjih';
      globalSectorChart.update();
    }
  }
});