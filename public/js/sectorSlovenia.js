document.addEventListener('DOMContentLoaded', function() {
  // Helper functions
  async function fetchSectorData(entity, yearRange) {
    try {
      const response = await fetch(`/api/sector-emissions?entity=${entity}&year=${yearRange}`);
      if (!response.ok) throw new Error(`API error: ${response.status} ${response.statusText}`);
      const data = await response.json();
      if (!data || data.length === 0) {
        console.warn(`No data returned for entity: ${entity}, year: ${yearRange}`);
        return [];
      }
      return data;
    } catch (error) {
      console.error('Error fetching sector data:', error);
      return [];
    }
  }



  function parseEmissionValue(value) {
    if (value === '' || value === null || value === undefined) return 0;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Sector labels and colors
  const sectors = [
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
  const shortLabelsSlovenian = [
    'Stavbe',
    'Industrija',
    'Raba zemljišč',
    'Druga goriva',
    'Promet',
    'Proizvodnja',
    'Energetika',
    'Elektrika in toplota',
    'Bunker goriva'
  ];
  const colors = [
    '#FF6F61', '#6B7280', '#10B981', '#FBBF24', '#3B82F6',
    '#EF4444', '#8B5CF6', '#EC4899', '#F59E0B'
  ];

  // Update summary cards
  async function updateSummaryCards() {
    try {
      const data = await fetchSectorData('Slovenia', '2021');
      if (!data.length) return;

      const record = data[0];
      const values = sectors.map(s => parseEmissionValue(record[s]) / 1000000); // Convert to Mt
      const maxIndex = values.reduce((iMax, x, i, arr) => x > arr[iMax] && x > 0 ? i : iMax, 0);

      const topSector = document.getElementById('topSector');
      const topSectorEmissions = document.getElementById('topSectorEmissions');
      if (topSector && topSectorEmissions) {
        topSector.textContent = shortLabelsSlovenian[maxIndex];
        topSectorEmissions.textContent = `${values[maxIndex].toFixed(2)} Mt (2021)`;
      }
    } catch (error) {
      console.error('Error updating summary cards:', error);
    }
  }

  // Sector Trend Chart
  async function createSectorTrendChart() {
    const ctx = document.getElementById('sectorTrendChart')?.getContext('2d');
    if (!ctx) {
      console.warn('Sector trend chart canvas not found');
      return;
    }

    const data = await fetchSectorData('Slovenia', '1990:2021');
    if (!data.length) {
      return;
    }

    window.sectorTrendData = data; 
    window.sectorYears = [...new Set(data.map(d => d.Year))].sort(); 

    const datasets = sectors.map((sector, index) => ({
      label: shortLabelsSlovenian[index],
      data: window.sectorYears.map(year => {
        const record = data.find(d => d.Year === year);
        return record ? parseEmissionValue(record[sector]) / 1000000 : 0;
      }),
      borderColor: colors[index],
      backgroundColor: colors[index] + '33',
      borderWidth: 2,
      fill: false,
      tension: 0.3,
      hidden: sector === 'Fugitive emissions of carbon dioxide from energy production'
    }));

    new Chart(ctx, {
      type: 'line',
      data: { labels: window.sectorYears, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { font: { size: 12 }, boxWidth: 20 } },
          tooltip: {
            callbacks: {
              label: context => `${context.dataset.label}: ${context.raw.toFixed(2)} Mt`
            }
          }
        },
        scales: {
          y: {
            title: { display: true, text: 'Milijonov ton CO₂', font: { size: 12 } },
            beginAtZero: false
          },
          x: {
            title: { display: true, text: 'Leto', font: { size: 12 } },
            ticks: { autoSkip: true, maxRotation: 0 }
          }
        }
      }
    });
  }

  // Combined Comparison Chart
  async function createComparisonCharts() {
    const year = '2021';
    const sloveniaData = await fetchSectorData('Slovenia', year);
    const europeData = await fetchSectorData('Europe', year);
    const worldData = await fetchSectorData('World', year);

    if (!sloveniaData.length || !europeData.length || !worldData.length) {
      return;
    }

    const sloveniaValues = sectors.map(s => parseEmissionValue(sloveniaData[0][s]) / 2100000);
    const europeValues = sectors.map(s => parseEmissionValue(europeData[0][s]) / 447000000);
    const worldValues = sectors.map(s => parseEmissionValue(worldData[0][s]) / 7800000000);

    const ctxCombined = document.getElementById('sloveniaVsEuropeWorldChart')?.getContext('2d');
    if (ctxCombined) {
      new Chart(ctxCombined, {
        type: 'bar',
        data: {
          labels: shortLabelsSlovenian, // Use Slovenian labels
          datasets: [
            { label: 'Slovenija', data: sloveniaValues, backgroundColor: '#3B82F6' },
            { label: 'Evropa', data: europeValues, backgroundColor: '#FBBF24' },
            { label: 'Svet', data: worldValues, backgroundColor: '#10B981' }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { font: { size: 12 }, boxWidth: 20 } },
            tooltip: {
              callbacks: {
                label: context => `${context.dataset.label}: ${context.raw.toFixed(2)} t/osebo`
              }
            }
          },
          scales: {
            y: { title: { display: true, text: 't CO₂ na prebivalca', font: { size: 12 } } },
            x: { title: { display: true, text: 'Sektor', font: { size: 12 } }, ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 } }
          }
        }
      });
    } else {
      console.warn('Combined comparison chart canvas not found');
    }
  }

  // Sector Pie Chart with Year Navigation
  let pieChartInstance = null; // Store the Chart.js instance
  let currentYear = 2021; // Initial year
  const minYear = 1990;
  const maxYear = 2021;

  async function createSectorPieChart(year) {
    const ctx = document.getElementById('sectorPieChart')?.getContext('2d');
    if (!ctx) {
      console.warn('Sector pie chart canvas not found');
      return;
    }

    const data = await fetchSectorData('Slovenia', year);
    if (!data.length) {
      return;
    }

    const values = sectors.map(s => {
      const value = parseEmissionValue(data[0][s]) / 1000000;
      return value > 0 ? value : 0;
    });

    // Destroy existing chart if it exists to prevent memory leaks
    if (pieChartInstance) {
      pieChartInstance.destroy();
    }

    // Create or update the pie chart
    pieChartInstance = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: shortLabelsSlovenian, // Use Slovenian labels
        datasets: [{ data: values, backgroundColor: colors }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { font: { size: 12 }, boxWidth: 20 } },
          tooltip: {
            callbacks: {
              label: context => `${context.label}: ${context.raw.toFixed(2)} Mt`
            }
          },
          title: {
            display: true,
            text: `Delež sektorjev (${year})`,
            font: { size: 16 },
            color: '#fff'
          }
        }
      }
    });

    // Update year display and button states
    const yearDisplay = document.getElementById('currentYear');
    if (yearDisplay) {
      yearDisplay.textContent = year;
    }
    updateButtonStates();
  }

  function updateButtonStates() {
    const prevButton = document.getElementById('prevYear');
    const nextButton = document.getElementById('nextYear');
    if (prevButton && nextButton) {
      prevButton.disabled = currentYear <= minYear;
      nextButton.disabled = currentYear >= maxYear;
    }
  }

  function setupYearNavigation() {
    const prevButton = document.getElementById('prevYear');
    const nextButton = document.getElementById('nextYear');

    if (prevButton) {
      prevButton.addEventListener('click', () => {
        if (currentYear > minYear) {
          currentYear--;
          createSectorPieChart(currentYear);
        }
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', () => {
        if (currentYear < maxYear) {
          currentYear++;
          createSectorPieChart(currentYear);
        }
      });
    }
  }

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

  // Download handler for sectorTrendChart
  window.downloadSectorTrendChartCSV = function() {
    if (!window.sectorTrendData || !window.sectorYears || window.sectorYears.length === 0) {
      alert('Ni podatkov za prenos. Prosimo, poskusite znova.');
      return;
    }

    const headers = ['Leto', ...shortLabelsSlovenian.map(label => label.replace(/\s/g, '_'))];
    const data = window.sectorYears.map(year => {
      const record = window.sectorTrendData.find(d => d.Year === year);
      const row = { year };
      sectors.forEach((sector, index) => {
        row[shortLabelsSlovenian[index]] = record ? parseEmissionValue(record[sector]) / 1000000 : 0;
      });
      return row;
    });

    const rowFormatter = row => [
      row.year,
      ...shortLabelsSlovenian.map(sector => row[sector].toFixed(2))
    ].join(',');

    downloadCSV(
      data,
      'slovenia_co2_emissions_by_sector_1990-2021.csv',
      headers,
      rowFormatter
    );
  };

  // Initialize charts
  async function initializeCharts() {
    try {
      const canvases = ['sectorTrendChart', 'sloveniaVsEuropeWorldChart', 'sectorPieChart'];
      const canvasExists = canvases.some(id => document.getElementById(id));
      if (!canvasExists) {
        console.log('No chart canvases found, skipping initialization');
        return;
      }

      if (typeof Chart === 'undefined') {
        console.error('Chart.js not loaded');
        return;
      }

      await Promise.all([
        updateSummaryCards(),
        createSectorTrendChart(),
        createComparisonCharts(),
        createSectorPieChart(currentYear)
      ]);

      setupYearNavigation();
    } catch (error) {
      console.error('Error initializing charts:', error);
    }
  }

  document.getElementById('tabContent')?.addEventListener('tabContentLoaded', initializeCharts);

  if (document.getElementById('sectorTrendChart')) {
    initializeCharts();
  }

  // Run initialization when tab content is loaded
  document.getElementById('tabContent')?.addEventListener('tabContentLoaded', initializeCharts);

  // Also run initialization if the script is loaded directly in the sector tab
  if (document.getElementById('sectorTrendChart')) {
    initializeCharts();
  }
});