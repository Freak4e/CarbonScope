 document.addEventListener('DOMContentLoaded', function() {
      // Chart instances
      let emissionsChart, sectorChart, comparisonChart, sectorLineChart, totalEmissionsChart, globalShareChart;
      
      // DOM elements
      const countrySelect = $('#countrySelect');
      const detailCountrySelect = $('#detailCountrySelect');
      const sectorLineCountrySelect = $('#sectorLineCountrySelect');
      const metricSelect = document.getElementById('metricSelect');
      const startYearInput = document.getElementById('startYearInput');
      const endYearInput = document.getElementById('endYearInput');
      const updateBtn = document.getElementById('updateBtn');
      const chartTitle = document.getElementById('chartTitle');
      let currentYear = 2022; // Default to 2022 as per your data
      
      // Initialize the dashboard
      initDashboard();
      
      // Event listeners
      if (updateBtn) {
        updateBtn.addEventListener('click', updateAllCharts);
      } else {
        console.warn('Update button not found');
      }
      
      async function initDashboard() {
        // Initialize Select2 dropdowns
        if (countrySelect) {
          countrySelect.select2({
            placeholder: "Izberi države za primerjavo...",
            allowClear: true,
            width: '100%',
            closeOnSelect: false
          });
        }
        
        if (detailCountrySelect) {
          detailCountrySelect.select2({
            placeholder: "Izberi državo za podrobnosti...",
            allowClear: true,
            width: '100%'
          });
        }
        
        if (sectorLineCountrySelect) {
          sectorLineCountrySelect.select2({
            placeholder: "Izberi državo...",
            allowClear: true,
            width: '25%'
          });
        }
        
        // Load countries
        await loadCountries();
        
        // Add change handlers
        if (detailCountrySelect) {
          detailCountrySelect.on('change', async function() {
            const country = $(this).val();
            if (country) {
              await updateSectorChart(country, currentYear);
            } else if (sectorChart) {
              sectorChart.data.datasets = [];
              sectorChart.update();
            }
          });
        }
        
        if (sectorLineCountrySelect) {
          sectorLineCountrySelect.on('change', async function() {
            const country = $(this).val();
            if (!country) {
              sectorLineChart.data.labels = [];
              sectorLineChart.data.datasets = [];
              sectorLineChart.options.plugins.title.text = 'Izberi državo za prikaz trendov po sektorjih';
              sectorLineChart.update();
              return;
            }
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
              const combinedData = emissionsData.map((yearData, index) => {
                return {
                  year: yearData.year,
                  ...sectorData[index].sectors
                };
              });
              const sectors = [
                { key: 'coal_co2', label: 'Premog', color: '#FF6384' },
                { key: 'oil_co2', label: 'Nafta', color: '#36A2EB' },
                { key: 'gas_co2', label: 'Plin', color: '#4BC0C0' },
                { key: 'cement_co2', label: 'Cement', color: '#FFCE56' },
                { key: 'flaring_co2', label: 'Sežiganje', color: '#9966FF' },
                { key: 'other_co2', label: 'Drugo', color: '#FF9F40' }
              ];
              const datasets = sectors.map(sector => {
                const sectorData = combinedData.map(item => item[sector.key] || 0);
                return {
                  label: sector.label,
                  data: sectorData,
                  borderColor: sector.color,
                  backgroundColor: 'transparent',
                  borderWidth: 2,
                  fill: false,
                  tension: 0.1
                };
              });
              sectorLineChart.data.labels = combinedData.map(item => item.year);
              sectorLineChart.data.datasets = datasets;
              sectorLineChart.options.plugins.title.text = `Trendi emisij CO₂ po sektorjih v ${country} (1990-2022)`;
              sectorLineChart.update();
            } catch (error) {
              console.error(`Error loading data for ${country}:`, error);
              sectorLineChart.data.labels = [];
              sectorLineChart.data.datasets = [];
              sectorLineChart.options.plugins.title.text = `Podatki za ${country} niso na voljo`;
              sectorLineChart.update();
            }
          });
        }
        
        initCharts();
        updateAllCharts();
        initTopCountriesCharts(); // Initialize new charts
        updateTopCountriesCharts(); // Update new charts with data
        
        document.querySelectorAll('#metricButtons [data-metric]').forEach(btn => {
          btn.addEventListener('click', function() {
            document.querySelectorAll('#metricButtons [data-metric]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const metric = this.dataset.metric;
            updateComparisonChart(countrySelect.val(), metric, endYearInput?.value || 2022);
          });
        });
      }
      
      async function loadCountries() {
        try {
          const response = await fetch('/api/countries');
          const countries = await response.json();
          
          [countrySelect, detailCountrySelect, sectorLineCountrySelect].forEach(select => {
            if (select) {
              select.empty();
              select.append(new Option("Izberi državo", ""));
              countries.forEach(country => {
                if (!['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'].includes(country)) {
                  const option = new Option(country, country);
                  select.append(option);
                }
              });
            }
          });
        } catch (error) {
          console.error('Error loading countries:', error);
        }
      }
      
      function initCharts() {
        const emissionsCanvas = document.getElementById('emissionsChart');
        if (emissionsCanvas) {
          const emissionsCtx = emissionsCanvas.getContext('2d');
          emissionsChart = new Chart(emissionsCtx, {
            type: 'line',
            data: { labels: [], datasets: [] },
            options: getChartOptions('CO₂ Emissions (million tonnes)')
          });
        } else {
          console.warn('Emissions chart canvas not found');
        }
        
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
        
        const comparisonCanvas = document.getElementById('comparisonChart');
        if (comparisonCanvas) {
          const comparisonCtx = comparisonCanvas.getContext('2d');
          comparisonChart = new Chart(comparisonCtx, {
            type: 'bar',
            data: { labels: [], datasets: [] },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false }, title: { display: true } },
              scales: { y: { beginAtZero: true } }
            }
          });
        } else {
          console.warn('Comparison chart canvas not found');
        }
      }
      
function initTopCountriesCharts() {
  const totalEmissionsCanvas = document.getElementById('totalEmissionsChart');
  if (!totalEmissionsCanvas) {
    console.error('Total Emissions chart canvas not found');
    return;
  }
  const totalEmissionsCtx = totalEmissionsCanvas.getContext(('2d'));
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
        // Add custom plugin to draw country names at the end of lines
        afterDraw: function(chart) {
          const ctx = chart.ctx;
          chart.data.datasets.forEach((dataset, i) => {
            const meta = chart.getDatasetMeta(i);
            if (!meta.hidden) {
              const lastPoint = meta.data[meta.data.length - 1];
              if (lastPoint) {
                const x = lastPoint.x + 5; // Offset to the right
                const y = lastPoint.y;
                ctx.save();
                ctx.font = '12px Open Sans';
                ctx.fillStyle = dataset.borderColor;
                ctx.fillText(dataset.label, x, y);
                ctx.restore();
              }
            }
          });
        }
      },
      scales: {
        y: { 
          title: { display: true, text: 'CO₂ Emissions (billion tonnes)' }, 
          beginAtZero: true,
          suggestedMax: 20
        },
        x: { title: { display: true, text: 'Year' } }
      },
      interaction: { intersect: false, mode: 'index' },
      elements: {
        point: {
          radius: 0 // Remove dots on data points
        }
      }
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
        // Add custom plugin to draw country names at the end of lines
        afterDraw: function(chart) {
          const ctx = chart.ctx;
          chart.data.datasets.forEach((dataset, i) => {
            const meta = chart.getDatasetMeta(i);
            if (!meta.hidden) {
              const lastPoint = meta.data[meta.data.length - 1];
              if (lastPoint) {
                const x = lastPoint.x + 5; // Offset to the right
                const y = lastPoint.y;
                ctx.save();
                ctx.font = '12px Open Sans';
                ctx.fillStyle = dataset.borderColor;
                ctx.fillText(dataset.label, x, y);
                ctx.restore();
              }
            }
          });
        }
      },
      scales: {
        y: { 
          title: { display: true, text: 'Share of Global CO₂ Emissions (%)' }, 
          beginAtZero: true,
          suggestedMax: 100
        },
        x: { title: { display: true, text: 'Year' } }
      },
      interaction: { intersect: false, mode: 'index' },
      elements: {
        point: {
          radius: 0 // Remove dots on data points
        }
      }
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

    // Prepare data for Total Emissions Chart
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

    // Update Total Emissions Chart
    if (totalEmissionsChart) {
      totalEmissionsChart.data.labels = years;
      totalEmissionsChart.data.datasets = totalEmissionsDatasets;
      totalEmissionsChart.update();
      console.log('Total Emissions Chart updated with', totalEmissionsDatasets.length, 'datasets');
    } else {
      console.error('totalEmissionsChart not initialized');
    }

    // Prepare data for Global Share Chart
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

    // Update Global Share Chart
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
      
      async function updateAllCharts() {
        const selectedCountries = countrySelect.val() || [];
        const metric = metricSelect ? metricSelect.value : 'co2';
        const startYear = startYearInput ? startYearInput.value : 1990;
        const endYear = endYearInput ? endYearInput.value : 2022;
        currentYear = endYear;
        
        if (emissionsChart) {
          await updateEmissionsChart(selectedCountries, metric, startYear, endYear);
        }
        if (comparisonChart) {
          await updateComparisonChart(selectedCountries, metric, endYear);
        }
        if (totalEmissionsChart && globalShareChart) {
          await updateTopCountriesCharts();
        }
        
        const detailCountry = detailCountrySelect.val();
        if (detailCountry && sectorChart) {
          await updateSectorChart(detailCountry, endYear);
        }
        
        const sectorLineCountry = sectorLineCountrySelect.val();
        if (sectorLineCountry && sectorLineChart) {
          sectorLineCountrySelect.trigger('change');
        }
      }
      
      async function updateSectorChart(country, year) {
        if (!sectorChart) return;
        
        try {
          const response = await fetch(`/api/sectors/${encodeURIComponent(country)}?year=${year}`);
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
          
          sectorChart.options.plugins.title = {
            display: true,
            text: `Emisije CO₂ po sektorjih v ${country} (${year})`
          };
          sectorChart.update();
        } catch (error) {
          console.error('Error loading sector data:', error);
          sectorChart.data.labels = [];
          sectorChart.data.datasets = [];
          sectorChart.update();
        }
      }
      
      async function updateEmissionsChart(countries, metric, startYear, endYear) {
        if (!emissionsChart) return;
        
        const datasets = [];
        let labels = [];
        
        for (const country of countries) {
          try {
            const response = await fetch(`/api/emissions?country=${encodeURIComponent(country)}&metric=${metric}&startYear=${startYear}&endYear=${endYear}`);
            const data = await response.json();
            
            if (data && data.length > 0) {
              if (labels.length === 0) {
                labels = data.map(d => d.year);
              }
              
              datasets.push({
                label: country,
                data: data.map(d => d.value),
                borderColor: getRandomColor(),
                backgroundColor: 'transparent',
                borderWidth: 2,
                fill: false,
                tension: 0.1
              });
            }
          } catch (error) {
            console.error(`Error fetching emissions data for ${country}:`, error);
          }
        }
        
        if (datasets.length > 0) {
          emissionsChart.data.labels = labels;
          emissionsChart.data.datasets = datasets;
          emissionsChart.options.scales.y.title.text = getAxisLabel(metric);
          if (chartTitle) {
            chartTitle.textContent = `${getMetricName(metric)} za ${countries.join(', ')} (${startYear}-${endYear})`;
          }
          emissionsChart.update();
        } else {
          console.warn('No emissions data available for the selected parameters');
          emissionsChart.data.labels = [];
          emissionsChart.data.datasets = [];
          emissionsChart.update();
        }
      }
      
      async function updateComparisonChart(countries, metric = 'co2', year = 2022) {
        if (!comparisonChart) {
          console.warn('Comparison chart not initialized');
          return;
        }
        
        try {
          if (!countries || countries.length === 0) {
            console.log('No countries selected, clearing comparison chart');
            comparisonChart.data.labels = [];
            comparisonChart.data.datasets = [];
            comparisonChart.update();
            document.querySelector('#metricsTable tbody').innerHTML = '';
            return;
          }
          
          const dataPoints = await Promise.all(
            countries.map(async country => {
              try {
                const response = await fetch(`/api/emissions?country=${encodeURIComponent(country)}&metric=${metric}&startYear=${year}&endYear=${year}`);
                if (!response.ok) {
                  console.warn(`API error for ${country}, metric ${metric}: ${response.status}`);
                  return { country, value: 0 };
                }
                const data = await response.json();
                if (!data || data.length === 0) {
                  console.warn(`No data for ${country}, metric ${metric}, year ${year}`);
                  return { country, value: 0 };
                }
                return { country, value: data[0].value || 0 };
              } catch (error) {
                console.error(`Error fetching comparison data for ${country}:`, error);
                return { country, value: 0 };
              }
            })
          );
          
          const validDataPoints = dataPoints.filter(d => d.value !== 0);
          if (validDataPoints.length === 0) {
            console.warn(`No valid data for metric ${metric}, falling back to co2`);
            if (metric !== 'co2') {
              return updateComparisonChart(countries, 'co2', year);
            }
            comparisonChart.data.labels = [];
            comparisonChart.data.datasets = [];
            comparisonChart.options.plugins.title.text = `Ni podatkov za ${getMetricName(metric)} (${year})`;
            comparisonChart.update();
            return;
          }
          
          validDataPoints.sort((a, b) => b.value - a.value);
          
          comparisonChart.data.labels = validDataPoints.map(d => d.country);
          comparisonChart.data.datasets = [{
            data: validDataPoints.map(d => d.value),
            backgroundColor: validDataPoints.map(() => getRandomColor()),
            borderColor: '#fff',
            borderWidth: 1
          }];
          
          comparisonChart.options.scales.y.title = {
            display: true,
            text: getAxisLabel(metric)
          };
          
          comparisonChart.options.plugins.title.text = `Primerjava: ${getMetricName(metric)} (${year})`;
          comparisonChart.update();
          
          await updateComparisonDashboard(countries, year);
        } catch (error) {
          console.error('Error in updateComparisonChart:', error);
          comparisonChart.data.labels = [];
          comparisonChart.data.datasets = [];
          comparisonChart.options.plugins.title.text = 'Napaka pri nalaganju podatkov';
          comparisonChart.update();
        }
      }
      
      async function updateComparisonDashboard(selectedCountries, year = 2022) {
        if (!selectedCountries || selectedCountries.length === 0) return;
        
        try {
          document.getElementById('currentYearDisplay').textContent = year;
          
          const countryData = await Promise.all(
            selectedCountries.map(async country => {
              const res = await fetch(`/api/emissions?country=${encodeURIComponent(country)}&startYear=${year}&endYear=${year}`);
              const data = await res.json();
              return data[0] || null;
            })
          ).then(results => results.filter(Boolean));
          
          const tableBody = document.querySelector('#metricsTable tbody');
          tableBody.innerHTML = countryData.map(country => `
            <tr>
              <td><span class="country-name">${country.country}</span></td>
              <td class="text-end">${country.co2_per_gdp ? country.co2_per_gdp.toFixed(2) + ' kg/$' : 'N/A'}</td>
              <td class="text-end">${country.energy_per_gdp ? (country.energy_per_gdp * 1000).toFixed(0) + ' Wh/$' : 'N/A'}</td>
            </tr>
          `).join('');
        } catch (error) {
          console.error('Error updating comparison dashboard:', error);
        }
      }
      
      function getChartOptions(yAxisTitle) {
        return {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top' },
            tooltip: {
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) label += ': ';
                  label += context.parsed.y.toLocaleString();
                  if (yAxisTitle.includes('tonnes')) label += ' tonnes';
                  if (yAxisTitle.includes('million')) label += ' million';
                  if (yAxisTitle.includes('%')) label += '%';
                  return label;
                }
              }
            }
          },
          scales: {
            y: { title: { display: true, text: yAxisTitle }, beginAtZero: false },
            x: { title: { display: true, text: 'Leto' } }
          }
        };
      }
      
      function getAxisLabel(metric) {
        const labels = {
          'co2': 'CO₂ emisije (milijon ton)',
          'co2_per_capita': 'CO₂ emisije (tone na osebo)',
          'share_global_co2': 'Delež globalnih emisij (%)',
          'temperature_change_from_co2': 'Vpliv na temperaturo (°C)',
          'co2_per_gdp': 'Intenzivnost CO₂ (kg na $)'
        };
        return labels[metric] || 'Vrednost';
      }
      
      function getMetricName(metric) {
        const names = {
          'co2': 'Skupni CO₂',
          'co2_per_capita': 'CO₂ na prebivalca',
          'share_global_co2': 'Delež v svetu',
          'temperature_change_from_co2': 'Vpliv na temperaturo',
          'co2_per_gdp': 'CO₂ glede na BDP'
        };
        return names[metric] || metric;
      }
      
      function getRandomColor() {
        return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
      }
    });