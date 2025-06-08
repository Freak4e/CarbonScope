document.addEventListener('DOMContentLoaded', function() {
  let sectorChart, sectorLineChart, globalSectorChart;
  let globalSectorData = [];
  let sectorLineData = [];
  let sectorData = [];

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
            title: { display: true, text: 'Trendi emisij CO₂ po vrsti goriva (1990-2022)', font: { size: 16 } }
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

  // Utility to download CSV
  function downloadCSV(data, filename, headers, rowFormatter) {
    console.log('Generating CSV for:', filename, 'Data length:', data.length);
    let csvContent = headers.join(',') + '\n';
    data.forEach(row => {
      try {
        csvContent += rowFormatter(row) + '\n';
      } catch (error) {
        console.warn('Skipping invalid row:', row, error);
      }
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Download handler for global sector chart
  window.downloadGlobalSectorCSV = async function(dataType = 'displayed') {
    const country = $('#unifiedCountrySelect').val() || 'World';

    if (dataType === 'all') {
      try {
        const countriesResponse = await fetch('/api/countries');
        if (!countriesResponse.ok) throw new Error(`Network response: ${countriesResponse.status}`);
        const allCountries = (await countriesResponse.json()).filter(
          c => !['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'].includes(c)
        );

        const allDataPromises = allCountries.map(async c => {
          try {
            const response = await fetch(`/api/sector-emissions?entity=${encodeURIComponent(c)}&year=1990:2021`);
            if (!response.ok) {
              console.warn(`Failed to fetch data for ${c}: ${response.status}`);
              return [];
            }
            const data = await response.json();
            return data.filter(d => d.Year != null && d.Entity != null);
          } catch (error) {
            console.warn(`Error fetching data for ${c}:`, error);
            return [];
          }
        });
        const allDataArrays = await Promise.all(allDataPromises);
        const dataToDownload = allDataArrays.flat();
        console.log('All global sector data fetched:', dataToDownload.length, 'rows');

        if (dataToDownload.length === 0) {
          alert('Ni podatkov za prenos. Preverite API povezavo.');
          return;
        }

        const columns = [
          'Entity', 'Code', 'Year',
          'Carbon dioxide emissions from buildings',
          'Carbon dioxide emissions from industry',
          'Carbon dioxide emissions from land use change and forestry',
          'Carbon dioxide emissions from other fuel combustion',
          'Carbon dioxide emissions from transport',
          'Carbon dioxide emissions from manufacturing and construction',
          'Fugitive emissions of carbon dioxide from energy production',
          'Carbon dioxide emissions from electricity and heat',
          'Carbon dioxide emissions from bunker fuels'
        ];
        const headers = [
          'Država', 'Koda', 'Leto',
          'Zgradbe', 'Industrija', 'Spremembe rabe zemljišč', 'Druga goriva',
          'Promet', 'Proizvodnja in gradbeništvo', 'Fugitivne emisije',
          'Elektrika in toplota', 'Bunker goriva'
        ];
        const rowFormatter = data => columns.map(col => {
          const value = data[col];
          return value != null ? (typeof value === 'number' ? (value / 1000000).toFixed(2) : value.toString().replace(/,/g, '')) : '';
        }).join(',');

        downloadCSV(dataToDownload, 'co2_emissions_by_sectors.csv', headers, rowFormatter);
      } catch (error) {
        console.error('Error downloading all global sector data:', error);
        alert('Napaka pri prenosu celotnih podatkov.');
      }
    } else {
      if (!country || globalSectorData.length === 0) {
        alert('Izberite državo ali posodobite graf za prenos prikazanih podatkov.');
        return;
      }

      const headers = ['Leto', ...globalSectorChart.data.datasets.map(ds => ds.label.replace(/\s/g, '_'))];
      const rowFormatter = row => {
        const values = globalSectorChart.data.datasets.map(ds => {
          const idx = globalSectorChart.data.labels.indexOf(row.Year);
          return idx >= 0 ? (ds.data[idx] || 0).toFixed(2) : '0.00';
        });
        return `${row.Year},${values.join(',')}`;
      };

      downloadCSV(
        globalSectorChart.data.labels.map(year => ({ Year: year })),
        `co2_sectors_${country}_1990-2021.csv`,
        headers,
        rowFormatter
      );
    }
  };

  // Download handler for sector line chart
  window.downloadSectorLineCSV = async function(dataType = 'displayed') {
    const country = $('#unifiedCountrySelect').val() || 'World';

    if (dataType === 'all') {
      try {
        const countriesResponse = await fetch('/api/countries');
        if (!countriesResponse.ok) throw new Error(`Network response: ${countriesResponse.status}`);
        const allCountries = (await countriesResponse.json()).filter(
          c => !['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'].includes(c)
        );

        const allDataPromises = allCountries.map(async c => {
          try {
            const response = await fetch(`/api/emissions?country=${encodeURIComponent(c)}&startYear=1990&endYear=2022&includeFuel=true`);
            if (!response.ok) {
              console.warn(`Failed to fetch data for ${c}: ${response.status}`);
              return [];
            }
            const data = await response.json();
            return data.filter(d => d.year != null && d.country != null);
          } catch (error) {
            console.warn(`Error fetching data for ${c}:`, error);
            return [];
          }
        });
        const allDataArrays = await Promise.all(allDataPromises);
        const dataToDownload = allDataArrays.flat();
        console.log('All sector line data fetched:', dataToDownload.length, 'rows');

        if (dataToDownload.length === 0) {
          alert('Ni podatkov za prenos. Preverite API povezavo.');
          return;
        }

        const columns = ['country', 'year', 'coal_co2', 'oil_co2', 'gas_co2', 'cement_co2', 'flaring_co2', 'other_co2'];
        const headers = ['Država', 'Leto', 'Premog', 'Nafta', 'Plin', 'Cement', 'Sežiganje', 'Drugo'];
        const rowFormatter = data => columns.map(col => {
          const value = data[col];
          return value != null ? (typeof value === 'number' ? value.toFixed(2) : value.toString().replace(/,/g, '')) : '';
        }).join(',');

        downloadCSV(dataToDownload, 'co2_fuel_type.csv', headers, rowFormatter);
      } catch (error) {
        console.error('Error downloading all sector line data:', error);
        alert('Napaka pri prenosu celotnih podatkov.');
      }
    } else {
      if (!country || sectorLineData.length === 0) {
        alert('Izberite državo ali posodobite graf za prenos prikazanih podatkov.');
        return;
      }

      const headers = ['Leto', ...sectorLineChart.data.datasets.map(ds => ds.label.replace(/\s/g, '_'))];
      const rowFormatter = row => {
        const values = sectorLineChart.data.datasets.map(ds => {
          const idx = sectorLineChart.data.labels.indexOf(row.year);
          return idx >= 0 ? (ds.data[idx] || 0).toFixed(2) : '0.00';
        });
        return `${row.year},${values.join(',')}`;
      };

      downloadCSV(
        sectorLineData,
        `co2_fuel_type_${country}_1990-2022.csv`,
        headers,
        rowFormatter
      );
    }
  };

  // Download handler for sector chart
  window.downloadSectorCSV = async function(dataType = 'displayed') {
    const country = $('#unifiedCountrySelect').val() || 'World';
    const year = 2022;

    if (dataType === 'all') {
      try {
        const countriesResponse = await fetch('/api/countries');
        if (!countriesResponse.ok) throw new Error(`Network response: ${countriesResponse.status}`);
        const allCountries = (await countriesResponse.json()).filter(
          c => !['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'].includes(c)
        );

        const allDataPromises = allCountries.map(async c => {
          try {
            const response = await fetch(`/api/emissions?country=${encodeURIComponent(c)}&startYear=1990&endYear=2022&includeFuel=true`);
            if (!response.ok) {
              console.warn(`Failed to fetch data for ${c}: ${response.status}`);
              return [];
            }
            const data = await response.json();
            return data.filter(d => d.year != null && d.country != null);
          } catch (error) {
            console.warn(`Error fetching data for ${c}:`, error);
            return [];
          }
        });
        const allDataArrays = await Promise.all(allDataPromises);
        const dataToDownload = allDataArrays.flat();
        console.log('All sector data fetched:', dataToDownload.length, 'rows');

        if (dataToDownload.length === 0) {
          alert('Ni podatkov za prenos. Preverite API povezavo.');
          return;
        }

        const columns = ['country', 'year', 'coal_co2', 'oil_co2', 'gas_co2', 'cement_co2', 'flaring_co2', 'other_co2'];
        const headers = ['Država', 'Leto', 'Premog', 'Nafta', 'Plin', 'Cement', 'Sežiganje', 'Drugo'];
        const rowFormatter = data => columns.map(col => {
          const value = data[col];
          return value != null ? (typeof value === 'number' ? value.toFixed(2) : value.toString().replace(/,/g, '')) : '';
        }).join(',');

        downloadCSV(dataToDownload, 'sector_data.csv', headers, rowFormatter);
      } catch (error) {
        console.error('Error downloading all sector data:', error);
        alert('Napaka pri prenosu celotnih podatkov.');
      }
    } else {
      if (!country || sectorData.length === 0) {
        alert('Izberite državo ali posodobite graf za prenos prikazanih podatkov.');
        return;
      }

      const headers = ['Sektor', 'CO2_Emisije_milijonov_ton'];
      const rowFormatter = row => `${row.label.replace(/\s/g, '_')},${row.value.toFixed(2)}`;

      downloadCSV(
        sectorChart.data.labels.map((label, idx) => ({
          label,
          value: sectorChart.data.datasets[0].data[idx] || 0
        })),
        `sector_${country}_2022.csv`,
        headers,
        rowFormatter
      );
    }
  };

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
      const data = await response.json();

      const sectorLabels = Object.keys(data.sectors).map(key => {
       const slovenianLabels = {
    'coal_co2': 'Premog',
    'oil_co2': 'Nafta',
    'gas_co2': 'Plin',
    'cement_co2': 'Cement',
    'flaring_co2': 'Sežiganje',
    'other_co2': 'Drugo'
       };
       return slovenianLabels[key] || key.replace(/_co2$/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      });

      sectorData = sectorLabels.map((label, idx) => ({
        label,
        value: Object.values(data.sectors)[idx] || 0
      }));

      sectorChart.data.labels = sectorLabels;
      sectorChart.data.datasets = [{
        data: Object.values(data.sectors),
        backgroundColor: ['#FF6384', '#36A2EB', '#4BC0C0', '#FFCE56', '#9966FF', '#FF9F40', '#E7E9ED', '#F7464A'],
        borderColor: '#fff',
        borderWidth: 1
      }];

      sectorChart.options.plugins.title.text = `Emisije CO₂ po sektorjih v ${country} (${year})`;
      sectorChart.update();
    } catch (error) {
      console.error(`Error loading sector data for ${country}:`, error);
      sectorChart.data.labels = [];
      sectorChart.data.datasets = [];
      sectorChart.options.plugins.title.text = `Podatki za ${country} niso na voljo`;
      sectorChart.update();
      sectorData = [];
    }
  }

  async function updateSectorLineChart(country) {
    if (!sectorLineChart) return;

    try {
      const emissionsResponse = await fetch(`/api/emissions?country=${encodeURIComponent(country)}&startYear=1990&endYear=2022`);
      if (!emissionsResponse.ok) throw new Error(`Network response: ${emissionsResponse.status}`);
      const emissionsData = await emissionsResponse.json();

      if (!emissionsData || emissionsData.length === 0) throw new Error('No data returned');

      const sectorDataResponses = await Promise.all(
        emissionsData.map(async yearData => (await fetch(`/api/sectors/${encodeURIComponent(country)}?year=${yearData.year}`)).json())
      );

      const combinedData = emissionsData.map((yearData, idx) => ({
        year: yearData.year,
        ...sectorDataResponses[idx].sectors
      }));

      sectorLineData = combinedData;

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
      sectorLineData = [];
    }
  }

  async function updateGlobalSectorChart(country) {
    if (!globalSectorChart) return;

    try {
      const response = await fetch(`/api/sector-emissions?entity=${encodeURIComponent(country)}&year=1990:2021`);
      if (!response.ok) throw new Error(`Network response: ${response.status}`);
      const data = await response.json();

      if (!data || data.length === 0) throw new Error('No data returned');

      globalSectorData = data;

      const availableYears = [...new Set(data.map(d => parseInt(d.Year)))].sort((a, b) => a - b);

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
          const record = data.find(d => parseInt(d.Year) === year);
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
      globalSectorData = [];
    }
  }

  function clearAllCharts() {
    if (sectorChart) {
      sectorChart.data.labels = [];
      sectorChart.data.datasets = [];
      sectorChart.options.plugins.title.text = 'Izberi državo za prikaz emisij po sektorjih';
      sectorChart.update();
      sectorData = [];
    }
    if (sectorLineChart) {
      sectorLineChart.data.labels = [];
      sectorLineChart.data.datasets = [];
      sectorLineChart.options.plugins.title.text = 'Izberi državo za prikaz trendov po vrsti goriva';
      sectorLineChart.update();
      sectorLineData = [];
    }
    if (globalSectorChart) {
      globalSectorChart.data.labels = [];
      globalSectorChart.data.datasets = [];
      globalSectorChart.options.plugins.title.text = 'Izberi državo za prikaz globalnih emisij po sektorjih';
      globalSectorChart.update();
      globalSectorData = [];
    }
  }

  if (document.getElementById('sectorChart') || document.getElementById('sectorLineChart') || document.getElementById('globalSectorChart')) {
    initSectorsTab();
  }
});