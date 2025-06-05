document.addEventListener('DOMContentLoaded', function() {
  let sectorChart, sectorLineChart, globalSectorChart;

  window.initSectorsTab = async function() {
    const unifiedCountrySelect = $('#unifiedCountrySelect');

    if (unifiedCountrySelect.length) {
      unifiedCountrySelect.select2({
        placeholder: "Izberi državo...",
        allowClear: true,
        width: '100%',
        minimumResultsForSearch: 1
      });
    } else {
      console.warn('unifiedCountrySelect not found');
      return;
    }

    await loadCountries();
    initSectorCharts();

    try {
      unifiedCountrySelect.val('World').trigger('select2:select');
      await updateAllSectorCharts('World');
    } catch (error) {
      console.error('Error setting default to World:', error);
    }

    unifiedCountrySelect.on('select2:select select2:clear', async function() {
      const country = $(this).val() || '';
      if (!country) {
        clearAllCharts();
        return;
      }
      await updateAllSectorCharts(country);
    });
  };

  async function loadCountries() {
    try {
      const response = await fetch('/api/countries');
      if (!response.ok) throw new Error(`Network response: ${response.status}`);
      const countries = await response.json();

      const unifiedCountrySelect = $('#unifiedCountrySelect');
      if (unifiedCountrySelect.length) {
        unifiedCountrySelect.empty();
        unifiedCountrySelect.append(new Option("Svet", "World", true, true));
        countries.forEach(country => {
          if (!['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'].includes(country)) {
            unifiedCountrySelect.append(new Option(country, country));
          }
        });
      }
    } catch (error) {
      console.error('Error loading countries:', error);
    }
  }

  function initSectorCharts() {
    const sectorCanvas = document.getElementById('sectorChart');
    if (sectorCanvas) {
      sectorChart = new Chart(sectorCanvas.getContext('2d'), {
        type: 'pie',
        data: { labels: [], datasets: [] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { boxWidth: 12, padding: 10, font: { size: 12 } } },
            tooltip: { callbacks: { label: context => `${context.label}: ${context.raw.toFixed(2)} milijonov ton` } },
            title: { display: true, text: 'Emisije CO₂ po sektorjih', font: { size: 16 } }
          }
        }
      });
    }

    const sectorLineCanvas = document.getElementById('sectorLineChart');
    if (sectorLineCanvas) {
      sectorLineChart = new Chart(sectorLineCanvas.getContext('2d'), {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { boxWidth: 12, padding: 20 } },
            tooltip: { callbacks: { label: context => `${context.dataset.label}: ${context.raw.toFixed(2)} milijonov ton` } },
            title: { display: true, text: 'Trendi emisij CO₂ po vrsti goriva (1990–2022)', font: { size: 16 } }
          },
          scales: { y: { title: { display: true, text: 'CO₂ emisije (milijoni ton)' }, beginAtZero: true }, x: { title: { display: true, text: 'Leto' } } },
          interaction: { intersect: false, mode: 'index' }
        }
      });
    }

    const globalSectorCanvas = document.getElementById('globalSectorChart');
    if (globalSectorCanvas) {
      globalSectorChart = new Chart(globalSectorCanvas.getContext('2d'), {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { boxWidth: 12, padding: 20 } },
            tooltip: { callbacks: { label: context => `${context.dataset.label}: ${context.raw.toFixed(2)} milijonov ton` } },
            title: { display: true, text: 'Globalne emisije CO₂ po sektorjih (1990–2021)', font: { size: 16 } }
          },
          scales: { y: { title: { display: true, text: 'CO₂ emisije (milijoni ton)' }, beginAtZero: true }, x: { title: { display: true, text: 'Leto' } } },
          interaction: { intersect: false, mode: 'index' },
          elements: { line: { borderWidth: 2, tension: 0.1 }, point: { radius: 3, hoverRadius: 5 } }
        }
      });
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
      if (!response.ok) throw new Error(`Network response: ${response.status}`);
      const sectorData = await response.json();

      const sectorLabels = Object.keys(sectorData.sectors).map(s =>
        s.replace(/_co2$/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      );

      sectorChart.data.labels = sectorLabels;
      sectorChart.data.datasets = [{
        data: Object.values(sectorData.sectors),
        backgroundColor: ['#FF6384', '#36A2EB', '#4BC0C0', '#FFCE56', '#9966FF', '#FF9F40', '#E7E9ED', '#F7464A'],
        borderColor: '#fff',
        borderWidth: 1
      }];

      sectorChart.options.plugins.title.text = `Emisije CO₂ po sektorjih v ${country} (${year})`;
      sectorChart.update();
    }catch (error) {
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
      if (!emissionsResponse.ok) throw new Error(`Network response: ${emissionsResponse.status}`);
      const emissionsData = await emissionsResponse.json();

      if (!emissionsData || emissionsData.length === 0) throw new Error('No data returned');

      const sectorData = await Promise.all(
        emissionsData.map(async yearData => (await fetch(`/api/sectors/${encodeURIComponent(country)}?year=${yearData.year}`)).json())
      );

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
      sectorLineChart.options.plugins.title.text = `Trendi emisij CO₂ po vrsti goriva v ${country} (1990–2022)`;
      sectorLineChart.update();
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
      if (!response.ok) throw new Error(`Network response: ${response.status}`);
      const sectorData = await response.json();

      if (!sectorData || sectorData.length === 0) throw new Error('No data returned');

      const availableYears = [...new Set(sectorData.map(d => parseInt(d.Year)))].sort((a, b) => a - b);

      const sectors = [
        { key: 'Carbon dioxide emissions from buildings', label: 'Zgradbe', color: '#FF6384' },
        { key: 'Carbon dioxide emissions from industry', label: 'Industrija', color: '#36A2EB' },
        { key: 'Carbon dioxide emissions from land use change and forestry', label: 'Spremembe rabe zemljišč', color: '#4BC0C0' },
        { key: 'Carbon dioxide emissions from other fuel combustion', label: 'Druga goriva', color: '#FFCE56' },
        { key: 'Carbon dioxide emissions from transport', label: 'Promet', color: '#9966FF' },
        { key: 'Carbon dioxide emissions from manufacturing and construction', label: 'Proizvodnja in gradbeništvo', color: '#FF9F40' },
        { key: 'Fugitive emissions of carbon dioxide from energy production', label: 'Fugitivne emisije', color: '#E7E9ED' },
        { key: 'Carbon dioxide emissions from electricity and heat', label: 'Elektrika in toplota', color: '#36A2EB' },
        { key: 'Carbon dioxide emissions from bunker fuels', label: 'Bunker goriva', color: '#F7464A' }
      ];

      const datasets = sectors.map(sector => ({
        label: sector.label,
        data: availableYears.map(year => {
          const record = sectorData.find(d => parseInt(d.Year) === year);
          const value = record && record[sector.key] ? parseFloat(record[sector.key]) : null;
          return isNaN(value) ? null : value / 1000000;
        }),
        borderColor: sector.color,
        backgroundColor: 'transparent',
        borderWidth: 2,
        fill: false,
        tension: 0.1,
        pointRadius: 3,
        pointHoverRadius: 5,
        spanGaps: true
      }));

      globalSectorChart.data.labels = availableYears;
      globalSectorChart.data.datasets = datasets;
      globalSectorChart.options.plugins.title.text = `Globalne emisije CO₂ po sektorjih v ${country} (${availableYears[0]}-${availableYears[availableYears.length - 1]})`;
      globalSectorChart.update();
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
      sectorChart.data.labels = [];
      sectorChart.data.datasets = [];
      sectorChart.options.plugins.title.text = 'Izberi državo za prikaz emisij po sektorjih';
      sectorChart.update();
    }
    if (sectorLineChart) {
      sectorLineChart.data.labels = [];
      sectorLineChart.data.datasets = [];
      sectorLineChart.options.plugins.title.text = 'Izberi državo za prikaz trendov po vrsti goriva';
      sectorLineChart.update();
    }
    if (globalSectorCanvas) {
      globalSectorChart.data.labels = [];
      globalSectorChart.data.datasets = [];
      globalSectorChart.options.plugins.title.text = 'Izberi državo za prikaz globalnih emisij po sektorjih';
      globalSectorChart.update();
    }
  }

  if (document.getElementById('sectorChart') || document.getElementById('sectorLineChart') || document.getElementById('globalSectorChart')) {
    initSectorsTab();
  }
});