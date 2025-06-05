document.addEventListener('DOMContentLoaded', function() {
  // Chart instances
  let emissionsChart, comparisonChart, totalEmissionsChart, globalShareChart;

  // Initialize dashboard when tab content is loaded
  function initDashboard() {
    // DOM elements
    const countrySelect = $('#countrySelect');
    const metricSelect = document.getElementById('metricSelect');
    const startYearInput = document.getElementById('startYearInput');
    const endYearInput = document.getElementById('endYearInput');
    const updateBtn = document.getElementById('updateBtn');
    const chartTitle = document.getElementById('chartTitle');
    let currentYear = 2022;

    // Check if required elements exist
    if (!countrySelect.length && !document.getElementById('totalEmissionsChart')) {
      console.log('No dashboard elements found, skipping initialization');
      return;
    }

    // Initialize Select2 dropdown for countrySelect
    if (countrySelect.length) {
      try {
        countrySelect.select2({
          placeholder: "Izberi države za primerjavo...",
          allowClear: true,
          width: '100%',
          closeOnSelect: false
        });
      } catch (error) {
        console.error('Error initializing Select2:', error);
      }
    }

    // Load countries
    loadCountries();

    // Initialize charts
    initCharts();
    initTopCountriesCharts();
    updateTopCountriesCharts();

    // Event listeners
    if (updateBtn) {
      updateBtn.addEventListener('click', updateAllCharts);
    }

    // Add metric button event listeners
    document.querySelectorAll('#metricButtons [data-metric]').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('#metricButtons [data-metric]').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const metric = this.dataset.metric;
        updateComparisonChart(countrySelect.val() || [], metric, endYearInput?.value || 2022);
      });
    });
  }

  async function loadCountries() {
    try {
      const response = await fetch('/api/countries');
      if (!response.ok) throw new Error(`Network response was not ok: ${response.status}`);
      const countries = await response.json();

      const countrySelect = $('#countrySelect');
      if (countrySelect.length) {
        countrySelect.empty();
        countrySelect.append(new Option("Izberi državo", ""));
        countries.forEach(country => {
          if (!['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'].includes(country)) {
            const option = new Option(country, country);
            countrySelect.append(option);
          }
        });
      }
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


  async function updateAllCharts() {
    const selectedCountries = $('#countrySelect').val() || [];
    const metric = metricSelect ? metricSelect.value : 'co2';
    const startYear = startYearInput ? startYearInput.value : 1990;
    const endYear = endYearInput ? endYearInput.value : 2022;

    if (emissionsChart) await updateEmissionsChart(selectedCountries, metric, startYear, endYear);
    if (comparisonChart) await updateComparisonChart(selectedCountries, metric, endYear);
    if (totalEmissionsChart && globalShareChart) await updateTopCountriesCharts();
  }

  async function updateEmissionsChart(countries, metric, startYear, endYear) {
    if (!emissionsChart) return;

    const datasets = [];
    let labels = [];

    for (const country of countries) {
      try {
        const response = await fetch(`/api/emissions?country=${encodeURIComponent(country)}&metric=${metric}&startYear=${startYear}&endYear=${endYear}`);
        if (!response.ok) throw new Error(`Network response was not ok: ${response.status}`);
        const data = await response.json();

        if (data && data.length > 0) {
          if (labels.length === 0) labels = data.map(d => d.year);
          datasets.push({
            label: country,
            data: data.map(d => d.value || 0),
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
      if (document.getElementById('chartTitle')) {
        document.getElementById('chartTitle').textContent = `${getMetricName(metric)} za ${countries.join(', ')} (${startYear}-${endYear})`;
      }
      emissionsChart.update();
    } else {
      emissionsChart.data.labels = [];
      emissionsChart.data.datasets = [];
      emissionsChart.update();
    }
  }

  async function updateComparisonChart(countries, metric = 'co2', year = 2022) {
    if (!comparisonChart) return;

    try {
      if (!countries || countries.length === 0) {
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
            if (!response.ok) return { country, value: 0 };
            const data = await response.json();
            return { country, value: data[0]?.value || 0 };
          } catch (error) {
            console.error(`Error fetching comparison data for ${country}:`, error);
            return { country, value: 0 };
          }
        })
      );

      const validDataPoints = dataPoints.filter(d => d.value !== 0);
      if (validDataPoints.length === 0 && metric !== 'co2') {
        return updateComparisonChart(countries, 'co2', year);
      }

      validDataPoints.sort((a, b) => b.value - a.value);

      comparisonChart.data.labels = validDataPoints.map(d => d.country);
      comparisonChart.data.datasets = [{
        data: validDataPoints.map(d => d.value),
        backgroundColor: validDataPoints.map(() => getRandomColor()),
        borderColor: '#fff',
        borderWidth: 1
      }];

      comparisonChart.options.scales.y.title = { display: true, text: getAxisLabel(metric) };
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

  // Listen for tab content loaded event
  document.getElementById('tabContent')?.addEventListener('tabContentLoaded', function(e) {
    if (e.detail.tab === 'overview-svet.html' || e.detail.tab === 'comparison.html') {
      initDashboard();
    }
  });

  // Initialize if already on a relevant tab
  if (document.getElementById('totalEmissionsChart') || document.getElementById('emissionsChart')) {
    initDashboard();
  }
});