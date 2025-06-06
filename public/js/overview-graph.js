document.addEventListener('DOMContentLoaded', function() {
  // Helper functions
  async function checkAPI() {
    try {
      const response = await fetch('/api/countries');
      if (!response.ok) throw new Error('API not available');
      return response.json();
    } catch (error) {
      console.error('API check failed:', error);
      throw error;
    }
  }

  async function fetchData(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${url}`);
      return response.json();
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  }

  function showError(message = 'Napaka pri nalaganju podatkov. Prosimo, osvežite stran ali poskusite kasneje.') {
    const tabContent = document.getElementById('tabContent');
    if (tabContent) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'alert alert-danger';
      errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i>${message}`;
      tabContent.prepend(errorDiv);
    } else {
      console.error('Tab content container not found');
    }
  }

  function updateSummaryCards(summary, sectors) {
    try {
      // Current emissions
      const currentEmissions = document.getElementById('currentEmissions');
      const emissionsChange = document.getElementById('emissionsChange');
      if (currentEmissions && emissionsChange) {
        currentEmissions.textContent = `${summary.co2?.toFixed(1) || '-'} Mt`;
        const changeText = summary.trend > 0 ? 'Povečanje' : 'Zmanjšanje';
        const changeClass = summary.trend > 0 ? 'text-danger' : 'text-success';
        emissionsChange.innerHTML = `
          <span class="${changeClass} text-xs font-weight-bolder">${changeText}</span>
          od 2000
        `;
      }

      // Per capita
      const perCapita = document.getElementById('perCapita');
      const perCapitaChange = document.getElementById('perCapitaChange');
      if (perCapita && perCapitaChange) {
        perCapita.textContent = `${summary.co2_per_capita?.toFixed(1) || '-'} t`;
        const changeText = summary.co2_per_capita > 5 ? 'Nad povprečjem' : 'Pod povprečjem';
        const changeClass = summary.co2_per_capita > 5 ? 'text-danger' : 'text-success';
        perCapitaChange.innerHTML = `
          <span class="${changeClass} text-xs font-weight-bolder">${changeText}</span>
          EU
        `;
      }

      // Global share
      const globalShare = document.getElementById('globalShare');
      const globalRank = document.getElementById('globalRank');
      if (globalShare && globalRank) {
        globalShare.textContent = `${summary.share_global_co2?.toFixed(3) || '-'}%`;
        globalRank.textContent = `svetovno`;
      }

      // Main sector
      const mainSector = document.getElementById('mainSector');
      const sectorPercentage = document.getElementById('sectorPercentage');
      if (mainSector && sectorPercentage && sectors?.sectors) {
        const sectorData = Object.entries(sectors.sectors);
        const topSector = sectorData.reduce((a, b) => a[1] > b[1] ? a : b);
        const sectorNames = {
          coal_co2: 'Premog',
          oil_co2: 'Nafta',
          gas_co2: 'Plin',
          cement_co2: 'Cement',
          flaring_co2: 'Plinsko zgorevanje',
          other_co2: 'Drugo'
        };
        const total = sectorData.reduce((sum, [_, val]) => sum + val, 0);
        const percentage = total > 0 ? (topSector[1] / total * 100).toFixed(1) : 0;
        mainSector.textContent = sectorNames[topSector[0]] || topSector[0];
        sectorPercentage.textContent = `${percentage}% celotnih emisij`;
      }
    } catch (error) {
      console.error('Error updating summary cards:', error);
    }
  }

  function createTrendChart(data) {
    try {
      const ctx = document.getElementById('trendChart')?.getContext('2d');
      if (!ctx) {
        console.warn('Trend chart canvas not found');
        return;
      }
      
      // Ensure data is sorted by year
      data.sort((a, b) => a.year - b.year);
      
      const years = data.map(d => d.year);
      const emissions = data.map(d => d.value);

      // Find min and max values
      const minValue = Math.min(...emissions);
      const maxValue = Math.max(...emissions);
      const minYear = years[emissions.indexOf(minValue)];
      const maxYear = years[emissions.indexOf(maxValue)];

      new Chart(ctx, {
        type: 'line',
        data: {
          labels: years,
          datasets: [{
            label: 'CO₂ emisije (Mt)',
            data: emissions,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: years.map((year, i) => {
              if (year === minYear || year === maxYear) {
                return 'rgba(255, 99, 132, 1)';
              }
              return 'rgba(75, 192, 192, 1)';
            }),
            pointRadius: years.map((year, i) => {
              if (year === minYear || year === maxYear) {
                return 6;
              }
              return 3;
            })
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: ${context.raw.toFixed(2)} Mt`;
                },
                afterLabel: function(context) {
                  if (context.label === minYear.toString()) {
                    return `Najnižja vrednost v obdobju`;
                  }
                  if (context.label === maxYear.toString()) {
                    return `Najvišja vrednost v obdobju`;
                  }
                  return '';
                }
              }
            },
            annotation: {
              annotations: {
                minLine: {
                  type: 'line',
                  yMin: minValue,
                  yMax: minValue,
                  borderColor: 'rgba(255, 99, 132, 0.5)',
                  borderWidth: 2,
                  borderDash: [6, 6],
                  label: {
                    content: `Min: ${minValue.toFixed(2)} Mt (${minYear})`,
                    enabled: true,
                    position: 'left'
                  }
                },
                maxLine: {
                  type: 'line',
                  yMin: maxValue,
                  yMax: maxValue,
                  borderColor: 'rgba(255, 99, 132, 0.5)',
                  borderWidth: 2,
                  borderDash: [6, 6],
                  label: {
                    content: `Max: ${maxValue.toFixed(2)} Mt (${maxYear})`,
                    enabled: true,
                    position: 'right'
                  }
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: false,
              title: {
                display: true,
                text: 'Milijonov ton CO₂',
                font: { size: 12 }
              }
            },
            x: {
              title: {
                display: true,
                text: 'Leto',
                font: { size: 12 }
              },
              type: 'category',
              ticks: {
                autoSkip: true,
                maxRotation: 0,
                minRotation: 0
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error creating trend chart:', error);
    }
  }

  function createCrisisChart(data, canvasId, title, labels) {
    try {
      const ctx = document.getElementById(canvasId)?.getContext("2d");
      if (!ctx) {
        console.warn(`Crisis chart canvas (${canvasId}) not found`);
        return;
      }
  
      // Ensure data is sorted by year
      data.sort((a, b) => a.year - b.year);
      const emissions = data.map((d) => d.value);
  
      // Create gradient for bar colors
      const gradientPositive = ctx.createLinearGradient(0, 0, 0, 400);
      gradientPositive.addColorStop(0, "rgba(54, 162, 235, 0.8)");
      gradientPositive.addColorStop(1, "rgba(54, 162, 235, 0.4)");
  
      const gradientNegative = ctx.createLinearGradient(0, 0, 0, 400);
      gradientNegative.addColorStop(0, "rgba(255, 99, 132, 0.8)");
      gradientNegative.addColorStop(1, "rgba(255, 99, 132, 0.4)");
  
      // Dynamic background colors based on change
      const backgroundColors = emissions.map((_, i) =>
        i === 0 ? gradientPositive : gradientNegative
      );
  
      new Chart(ctx, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            {
              label: "CO₂ Emisije (Mt)",
              data: emissions,
              backgroundColor: backgroundColors,
              borderColor: ["rgba(54, 162, 235, 1)", "rgba(255, 99, 132, 1)"],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1000,
            easing: "easeOutBounce",
          },
          plugins: {
            title: {
              display: true,
              text: title,
              font: { size: 18, weight: "bold" },
              padding: 16,
            },
            legend: {
              display: false,
            },
            tooltip: {
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              titleFont: { size: 14, weight: "bold" },
              bodyFont: { size: 12 },
              callbacks: {
                label: (context) =>
                  `${context.dataset.label}: ${context.raw.toFixed(2)} Mt`,
              },
            },
          },
          scales: {
            y: {
              beginAtZero: false,
              title: {
                display: true,
                text: "Milijonov ton CO₂",
                font: { size: 14, weight: "bold" },
              },
            },
            x: {
              title: {
                display: true,
                text: "Leto",
                font: { size: 14, weight: "bold" },
              },
            },
          },
          hover: {
            mode: "nearest",
            intersect: true,
            animationDuration: 400,
          },
        },
      });
    } catch (error) {
      console.error(`Error creating crisis chart (${canvasId}):`, error);
    }
  }
  

  function createPopulationCo2Chart(sloCo2Data, euCo2Data, worldCo2Data, sloPopData, euPopData, worldPopData) {
    try {
      const ctx = document.getElementById('populationCo2Chart')?.getContext('2d');
      if (!ctx) {
        console.warn('Population CO2 chart canvas not found');
        return;
      }

      // Sort all data by year
      sloCo2Data.sort((a, b) => a.year - b.year);
      euCo2Data.sort((a, b) => a.year - b.year);
      worldCo2Data.sort((a, b) => a.year - b.year);
      sloPopData.sort((a, b) => a.year - b.year);
      euPopData.sort((a, b) => a.year - b.year);
      worldPopData.sort((a, b) => a.year - b.year);

      const years = sloCo2Data.map(d => d.year);
      const sloPopValues = sloPopData.map(d => d.value / 1_000_000);
      const euPopValues = euPopData.map(d => d.value / 1_000_000);
      const worldPopValues = worldPopData.map(d => d.value / 1_000_000);
      const sloCo2Values = sloCo2Data.map(d => d.value);
      const euCo2Values = euCo2Data.map(d => d.value / 1_000); // Convert to billion tons
      const worldCo2Values = worldCo2Data.map(d => d.value / 1_000); // Convert to billion tons

      new Chart(ctx, {
        type: 'line',
        data: {
          labels: years,
          datasets: [
            {
              label: 'Slovenija: Prebivalstvo (milijoni)',
              data: sloPopValues,
              borderColor: '#1E90FF',
              backgroundColor: 'rgba(30, 144, 255, 0.1)',
              borderWidth: 2,
              fill: false,
              yAxisID: 'y-population',
              tension: 0.3
            },
            {
              label: 'Evropa: Prebivalstvo (milijoni)',
              data: euPopValues,
              borderColor: '#FF6347',
              backgroundColor: 'rgba(255, 99, 71, 0.1)',
              borderWidth: 2,
              fill: false,
              yAxisID: 'y-population',
              tension: 0.3
            },
            {
              label: 'Svet: Prebivalstvo (milijoni)',
              data: worldPopValues,
              borderColor: '#FFD700',
              backgroundColor: 'rgba(255, 215, 0, 0.1)',
              borderWidth: 2,
              fill: false,
              yAxisID: 'y-population',
              tension: 0.3
            },
            {
              label: 'Slovenija: CO₂ emisije (Mt)',
              data: sloCo2Values,
              borderColor: '#4682B4',
              backgroundColor: 'rgba(70, 130, 180, 0.2)',
              borderWidth: 2,
              fill: true,
              yAxisID: 'y-co2',
              tension: 0.4
            },
            {
              label: 'Evropa: CO₂ emisije (milijarde t)',
              data: euCo2Values,
              borderColor: '#DC143C',
              backgroundColor: 'rgba(220, 20, 60, 0.2)',
              borderWidth: 2,
              fill: true,
              yAxisID: 'y-co2',
              tension: 0.4
            },
            {
              label: 'Svet: CO₂ emisije (milijarde t)',
              data: worldCo2Values,
              borderColor: '#FFA500',
              backgroundColor: 'rgba(255, 165, 0, 0.2)',
              borderWidth: 2,
              fill: true,
              yAxisID: 'y-co2',
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.dataset.label;
                  const value = context.raw;
                  const unit = label.includes('Prebivalstvo') ? 'milijonov' : 
                              label.includes('Slovenija') && label.includes('CO₂') ? 'Mt' : 'milijarde t';
                  return `${label}: ${value.toFixed(2)} ${unit}`;
                }
              }
            },
            legend: {
              position: 'top',
              labels: { 
                font: { size: 12 }, 
                boxWidth: 20,
                padding: 20
              }
            }
          },
          scales: {
            'y-population': {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Prebivalstvo (milijoni)',
                font: { size: 12 }
              },
              grid: { drawOnChartArea: false }
            },
            'y-co2': {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: 'CO₂ emisije (Mt / milijarde t)',
                font: { size: 12 }
              },
              grid: { drawOnChartArea: false }
            },
            x: {
              title: {
                display: true,
                text: 'Leto',
                font: { size: 12 }
              }
            }
          },
          layout: { 
            padding: { top: 20 } 
          }
        }
      });
    } catch (error) {
      console.error('Error creating population CO2 chart:', error);
    }
  }

  // Initialize charts
  async function initializeCharts() {
    try {
      // Check if any required canvas exists
      const canvases = ['trendChart', 'populationCo2Chart', 'crisisChart2008', 'crisisChart2020'];
      const canvasExists = canvases.some(id => document.getElementById(id));
      
      if (!canvasExists) {
        console.log('No chart canvases found, skipping initialization');
        return;
      }

      // Wait for API to be available
      await checkAPI();

      // Fetch all data in parallel - now using separate endpoints for each country
      const [
        sloCo2Data, 
        euCo2Data, 
        worldCo2Data,
        sloPopData,
        euPopData,
        worldPopData,
        summary, 
        sectors, 
        crisis2008Data, 
        crisis2020Data
      ] = await Promise.all([
        fetchData('/api/emissions?country=Slovenia&metric=co2&startYear=1990'),
        fetchData('/api/emissions?country=Europe&metric=co2&startYear=1991&endYear=2023'),
        fetchData('/api/emissions?country=World&metric=co2&startYear=1991&endYear=2023'),
        fetchData('/api/emissions?country=Slovenia&metric=population&startYear=1991&endYear=2023'),
        fetchData('/api/emissions?country=Europe&metric=population&startYear=1991&endYear=2023'),
        fetchData('/api/emissions?country=World&metric=population&startYear=1991&endYear=2023'),
        fetchData('/api/summary/Slovenia'),
        fetchData('/api/sectors/Slovenia'),
        fetchData('/api/emissions?country=Slovenia&metric=co2&startYear=2008&endYear=2009'),
        fetchData('/api/emissions?country=Slovenia&metric=co2&startYear=2019&endYear=2020')
      ]);
      window.sloCo2Data = sloCo2Data;
      window.euCo2Data = euCo2Data;
      window.worldCo2Data = worldCo2Data;
      window.sloPopData = sloPopData;
      window.euPopData = euPopData;
      window.worldPopData = worldPopData;

      // Update UI with data
      updateSummaryCards(summary, sectors);
      createTrendChart(sloCo2Data);
      createPopulationCo2Chart(sloCo2Data, euCo2Data, worldCo2Data, sloPopData, euPopData, worldPopData);
      createCrisisChart(crisis2008Data, 'crisisChart2008', 'Finančna kriza 2008–2009', ['2008', '2009']);
      createCrisisChart(crisis2020Data, 'crisisChart2020', 'Pandemija COVID-19 2020', ['2019', '2020']);

    } catch (error) {
      console.error('Error initializing charts:', error);
      showError();
    }
  }

  // Run initialization when tab content is loaded
  document.getElementById('tabContent')?.addEventListener('tabContentLoaded', initializeCharts);

  // Also run initialization if the script is loaded directly in the overview tab
  if (document.getElementById('trendChart')) {
    initializeCharts();
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

// Download handler for trendChart
window.downloadTrendChartCSV = function() {
  if (!window.sloCo2Data || window.sloCo2Data.length === 0) {
    alert('Ni podatkov za prenos. Prosimo, poskusite znova.');
    return;
  }

  const headers = ['Leto', 'CO2_Emisije_Mt'];
  const rowFormatter = row => `${row.year},${row.value.toFixed(2)}`;

  downloadCSV(
    window.sloCo2Data,
    'slovenia_co2_emissions_1990-2023.csv',
    headers,
    rowFormatter
  );
};

// Download handler for populationCo2Chart
window.downloadPopulationCo2ChartCSV = function() {
  if (!window.sloCo2Data || !window.euCo2Data || !window.worldCo2Data ||
      !window.sloPopData || !window.euPopData || !window.worldPopData ||
      window.sloCo2Data.length === 0) {
    alert('Ni podatkov za prenos. Prosimo, poskusite znova.');
    return;
  }

  const headers = [
    'Leto',
    'Slovenija_Prebivalstvo_milijoni',
    'Evropa_Prebivalstvo_milijoni',
    'Svet_Prebivalstvo_milijoni',
    'Slovenija_CO2_Emisije_Mt',
    'Evropa_CO2_Emisije_milijarde_t',
    'Svet_CO2_Emisije_milijarde_t'
  ];

  const years = window.sloCo2Data.map(d => d.year);
  const data = years.map(year => {
    const sloCo2 = window.sloCo2Data.find(d => d.year === year)?.value || 0;
    const euCo2 = window.euCo2Data.find(d => d.year === year)?.value / 1_000 || 0;
    const worldCo2 = window.worldCo2Data.find(d => d.year === year)?.value / 1_000 || 0;
    const sloPop = window.sloPopData.find(d => d.year === year)?.value / 1_000_000 || 0;
    const euPop = window.euPopData.find(d => d.year === year)?.value / 1_000_000 || 0;
    const worldPop = window.worldPopData.find(d => d.year === year)?.value / 1_000_000 || 0;

    return {
      year,
      sloPop,
      euPop,
      worldPop,
      sloCo2,
      euCo2,
      worldCo2
    };
  });

  const rowFormatter = row => [
    row.year,
    row.sloPop.toFixed(2),
    row.euPop.toFixed(2),
    row.worldPop.toFixed(2),
    row.sloCo2.toFixed(2),
    row.euCo2.toFixed(2),
    row.worldCo2.toFixed(2)
  ].join(',');

  downloadCSV(
    data,
    'slovenia_eu_world_population_co2_1991-2023.csv',
    headers,
    rowFormatter
  );
};

});