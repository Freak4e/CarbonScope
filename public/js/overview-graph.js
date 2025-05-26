document.addEventListener('DOMContentLoaded', function() {
  // First check if API is available
  checkAPI().then(() => {
    // Load all data
    Promise.all([
      fetchData('/api/emissions?country=Slovenia&metric=co2&startYear=1990'),
      fetchData('/api/emissions?country=Slovenia&metric=co2_per_capita&startYear=1990'),
      fetchData('/api/emissions?country=European Union (27)&metric=co2_per_capita&startYear=1990'),
      fetchData('/api/emissions?country=World&metric=co2_per_capita&startYear=1990'),
      fetchData('/api/summary/Slovenia'),
      fetchData('/api/sectors/Slovenia'),
      fetchData('/api/slovenia-absolute-change') // Add this new endpoint
    ]).then(([co2Data, perCapitaData, euPerCapita, worldPerCapita, summary, sectors, yearOnYearData]) => {
      // Hide loading indicator
      document.getElementById('loadingIndicator').style.display = 'none';
      document.getElementById('contentContainer').style.display = 'block';
      
      // Debug: Log years to verify range
      const years = co2Data.map(d => d.year);
      console.log('Trend chart years:', years);
      
      // Update summary cards
      updateSummaryCards(summary, sectors);
      
      // Create charts
      createTrendChart(co2Data);
      createComparisonChart(perCapitaData, euPerCapita, worldPerCapita);
      createIntensityChart(co2Data, perCapitaData);
      createSloveniaYearOnYearChangeChart(yearOnYearData); // Add this line
      
    }).catch(error => {
      console.error('Error loading data:', error);
      showError();
    });
  }).catch(error => {
    console.error('API check failed:', error);
    showError();
  });

  // Helper functions
  async function checkAPI() {
    const response = await fetch('/api/countries');
    if (!response.ok) throw new Error('API not available');
    return response.json();
  }

  async function fetchData(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}`);
    return response.json();
  }

  function showError() {
    document.getElementById('loadingIndicator').innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-triangle me-2"></i>
        Napaka pri nalaganju podatkov. Prosimo, osvežite stran ali poskusite kasneje.
      </div>
    `;
  }

  function updateSummaryCards(summary, sectors) {
    // Current emissions
    document.getElementById('currentEmissions').textContent = `${summary.co2?.toFixed(1) || '-'} Mt`;
    const emissionsChange = summary.trend > 0 ? 'Povečanje' : 'Zmanjšanje';
    const emissionsClass = summary.trend > 0 ? 'text-danger' : 'text-success';
    document.getElementById('emissionsChange').innerHTML = `
      <span class="${emissionsClass} text-xs font-weight-bolder">${emissionsChange}</span>
      od 2000
    `;

    // Per capita
    document.getElementById('perCapita').textContent = `${summary.co2_per_capita?.toFixed(1) || '-'} t`;
    const perCapitaChange = summary.co2_per_capita > 5 ? 'Nad povprečjem' : 'Pod povprečjem';
    const perCapitaClass = summary.co2_per_capita > 5 ? 'text-danger' : 'text-success';
    document.getElementById('perCapitaChange').innerHTML = `
      <span class="${perCapitaClass} text-xs font-weight-bolder">${perCapitaChange}</span>
      EU
    `;

    // Global share
    const globalShare = summary.share_global_co2 ? summary.share_global_co2.toFixed(3) : '-';
    document.getElementById('globalShare').textContent = `${globalShare}%`;
    document.getElementById('globalRank').textContent = `#${summary.globalRank || '?'} svetovno`;

    // Main sector
    if (sectors && sectors.sectors) {
      const sectorData = Object.entries(sectors.sectors);
      const mainSector = sectorData.reduce((a, b) => a[1] > b[1] ? a : b);
      const sectorNames = {
        coal_co2: 'Premog',
        oil_co2: 'Nafta',
        gas_co2: 'Plin',
        cement_co2: 'Cement',
        flaring_co2: 'Plinsko zgorevanje',
        other_co2: 'Drugo'
      };
      const total = sectorData.reduce((sum, [_, val]) => sum + val, 0);
      const percentage = total > 0 ? (mainSector[1] / total * 100).toFixed(1) : 0;
      
      document.getElementById('mainSector').textContent = sectorNames[mainSector[0]] || mainSector[0];
      document.getElementById('sectorPercentage').textContent = `${percentage}% celotnih emisij`;
    }
  }

  function createTrendChart(data) {
    const ctx = document.getElementById('trendChart').getContext('2d');
    const years = data.map(d => d.year);
    const emissions = data.map(d => d.value);
    
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
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.raw.toFixed(2)} Mt`;
              }
            }
          },
          annotation: {
            annotations: {
              crisis2008: {
                type: 'line',
                xMin: 2008,
                xMax: 2008,
                borderColor: 'rgba(255, 99, 132, 0.7)',
                borderWidth: 1,
                label: {
                  content: 'Finančna kriza 2008',
                  enabled: true,
                  position: 'top',
                  backgroundColor: 'rgba(255, 99, 132, 0.8)',
                  color: 'white',
                  font: { size: 10 },
                  padding: 4
                }
              },
              covid2020: {
                type: 'line',
                xMin: 2020,
                xMax: 2020,
                borderColor: 'rgba(255, 99, 132, 0.7)',
                borderWidth: 1,
                label: {
                  content: 'Pandemija 2020',
                  enabled: true,
                  position: 'top',
                  backgroundColor: 'rgba(255, 99, 132, 0.8)',
                  color: 'white',
                  font: { size: 10 },
                  padding: 4
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
            min: 1990,
            max: 2023,
            type: 'linear',
            ticks: {
              stepSize: 1,
              callback: function(value) {
                return Number.isInteger(value) ? value : null;
              }
            }
          }
        },
        layout: {
          padding: {
            top: 20 // Space for annotations
          }
        }
      }
    });
  }

  function createComparisonChart(sloData, euData, worldData) {
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    const latestYear = Math.max(...sloData.map(d => d.year));
    
    const sloValue = sloData.find(d => d.year === latestYear)?.value || 0;
    const euValue = euData.find(d => d.year === latestYear)?.value || 0;
    const worldValue = worldData.find(d => d.year === latestYear)?.value || 0;
    
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Slovenija', 'EU', 'Svet'],
        datasets: [{
          label: 'CO₂ na prebivalca (t)',
          data: [sloValue, euValue, worldValue],
          backgroundColor: [
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 99, 132, 0.7)',
            'rgba(255, 206, 86, 0.7)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.raw.toFixed(2)} t`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Ton CO₂ na prebivalca',
              font: { size: 12 }
            }
          },
          x: {
            title: {
              display: true,
              text: 'Regija',
              font: { size: 12 }
            }
          }
        }
      }
    });
  }

  function createIntensityChart(co2Data, perCapitaData) {
    const ctx = document.getElementById('intensityChart').getContext('2d');
    const combinedData = co2Data.map(co2 => {
      const capita = perCapitaData.find(d => d.year === co2.year);
      return {
        year: co2.year,
        co2_per_gdp: capita?.co2_per_gdp || 0
      };
    });
    
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: combinedData.map(d => d.year),
        datasets: [{
          label: 'CO₂ na enoto BDP (kg/$)',
          data: combinedData.map(d => d.co2_per_gdp * 1000),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.raw.toFixed(2)} kg/$`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'kg CO₂ na $ BDP',
              font: { size: 12 }
            }
          },
          x: {
            title: {
              display: true,
              text: 'Leto',
              font: { size: 12 }
            }
          }
        }
      }
    });
  }

  function createSloveniaYearOnYearChangeChart(data) {
    const ctx = document.getElementById('yearOnYearChangeChart').getContext('2d');
    const labels = data.map(d => d.year);
    const values = data.map(d => d.value / 1_000_000); // convert to Mt

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Letna sprememba CO₂ emisij (Mt)',
          data: values,
          backgroundColor: values.map(v => v >= 0 ? 'rgba(54, 162, 235, 0.7)' : 'rgba(255, 99, 132, 0.7)'),
          borderColor: values.map(v => v >= 0 ? 'rgba(54, 162, 235, 1)' : 'rgba(255, 99, 132, 1)'),
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Milijonov ton CO₂ (Mt)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Leto'
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.parsed.y.toFixed(2)} Mt`
            }
          }
        }
      }
    });
  }
});