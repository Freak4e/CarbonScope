document.addEventListener('DOMContentLoaded', function() {
  // Chart instances
  let emissionsChart, sectorChart, comparisonChart, trendChart;
  
  // DOM elements
  const countrySelect = $('#countrySelect');
  const detailCountrySelect = $('#detailCountrySelect');
  const metricSelect = document.getElementById('metricSelect');
  const startYearInput = document.getElementById('startYear');
  const endYearInput = document.getElementById('endYear');
  const updateBtn = document.getElementById('updateBtn');
  const chartTitle = document.getElementById('chartTitle');
  let currentYear = new Date().getFullYear() - 1; // Default to previous year
  
  // Initialize the dashboard
  initDashboard();
  
  // Event listeners
  updateBtn.addEventListener('click', updateAllCharts);
  
  async function initDashboard() {
    // Initialize Select2 dropdowns
    countrySelect.select2({
      placeholder: "Select countries for comparison...",
      allowClear: true,
      width: '100%',
      closeOnSelect: false
    });
    
    detailCountrySelect.select2({
      placeholder: "Select a country for details...",
      allowClear: true,
      width: '100%'
    });
    
    // Load countries
    try {
      const countries = await fetch('/api/countries').then(res => res.json());
      
      // Initialize dropdown options
      countrySelect.empty();
      detailCountrySelect.empty();
      
      countries.forEach(country => {
        const option = new Option(country, country);
        countrySelect.append(option);
        detailCountrySelect.append(option.cloneNode(true));
      });
      
      // Add change handler for detail country select
      detailCountrySelect.on('change', async function() {
        const country = $(this).val();
        if (country) {
          await updateSectorChart(country, endYearInput.value);
        } else {
          sectorChart.data.datasets = [];
          sectorChart.update();
        }
      });
      
    } catch (error) {
      console.error('Error loading countries:', error);
    }
    
    initCharts();
    updateAllCharts();
    
    // Add event listeners for metric buttons
    document.querySelectorAll('[data-metric]').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('[data-metric]').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const metric = this.dataset.metric;
        updateComparisonChart(countrySelect.val(), metric, endYearInput.value);
      });
    });
  }
  
  function initCharts() {
    // Main emissions chart
    const emissionsCtx = document.getElementById('emissionsChart').getContext('2d');
    emissionsChart = new Chart(emissionsCtx, {
      type: 'line',
      data: { labels: [], datasets: [] },
      options: getChartOptions('CO₂ Emissions (million tonnes)')
    });
    
    // Sector breakdown chart
    const sectorCtx = document.getElementById('sectorChart').getContext('2d');
    sectorChart = new Chart(sectorCtx, {
      type: 'doughnut',
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
        },
        cutout: '65%'
      }
    });
    
    // Comparison chart
    const comparisonCtx = document.getElementById('comparisonChart').getContext('2d');
    comparisonChart = new Chart(comparisonCtx, {
      type: 'bar',
      data: { labels: [], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
    
    // Trend chart
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    trendChart = new Chart(trendCtx, {
      type: 'line',
      data: { labels: [], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.raw.toFixed(2)}% change`;
              }
            }
          }
        },
        scales: {
          y: {
            title: { display: true, text: 'Annual Change (%)' }
          }
        }
      }
    });
  }
  
  async function updateAllCharts() {
    const selectedCountries = countrySelect.val() || [];
    const metric = metricSelect.value;
    const startYear = startYearInput.value;
    const endYear = endYearInput.value;
    currentYear = endYear;
    
    await updateEmissionsChart(selectedCountries, metric, startYear, endYear);
    await updateComparisonChart(selectedCountries, metric, endYear);
    
    const detailCountry = detailCountrySelect.val();
    if (detailCountry) {
      await updateSectorChart(detailCountry, endYear);
    }
  }
  
  async function updateEmissionsChart(countries, metric, startYear, endYear) {
    const datasets = [];
    
    for (const country of countries) {
      const data = await fetch(`/api/emissions?country=${encodeURIComponent(country)}&metric=${metric}&startYear=${startYear}&endYear=${endYear}`)
        .then(res => res.json());
      
      if (data.length > 0) {
        if (emissionsChart.data.labels.length === 0) {
          emissionsChart.data.labels = data.map(d => d.year);
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
    }
    
    emissionsChart.data.datasets = datasets;
    emissionsChart.options.scales.y.title.text = getAxisLabel(metric);
    chartTitle.textContent = `${getMetricName(metric)} for ${countries.join(', ')}`;
    emissionsChart.update();
  }
  
  async function updateSectorChart(country, year) {
    try {
      const response = await fetch(`/api/sectors/${encodeURIComponent(country)}?year=${year}`);
      const sectorData = await response.json();
      
      sectorChart.data.labels = Object.keys(sectorData.sectors).map(s => 
        s.replace(/_co2$/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      );
      
      sectorChart.data.datasets = [{
        data: Object.values(sectorData.sectors),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#4BC0C0', 
          '#FFCE56', '#9966FF', '#FF9F40'
        ],
        borderColor: '#fff',
        borderWidth: 1
      }];
      
      sectorChart.update();
    } catch (error) {
      console.error('Error loading sector data:', error);
      sectorChart.data.datasets = [];
      sectorChart.update();
    }
  }
  
  async function updateComparisonChart(countries, metric = 'co2', year = 2022) {
    try {
      if (!countries || countries.length === 0) {
        comparisonChart.data.labels = [];
        comparisonChart.data.datasets = [];
        comparisonChart.update();
        trendChart.data.labels = [];
        trendChart.data.datasets = [];
        trendChart.update();
        document.querySelector('#metricsTable tbody').innerHTML = '';
        return;
      }

      // Fetch comparison data
      const dataPoints = await Promise.all(
        countries.map(async country => {
          const data = await fetch(`/api/emissions?country=${encodeURIComponent(country)}&metric=${metric}&startYear=${year}&endYear=${year}`)
            .then(res => res.json());
          return {
            country,
            value: data.length > 0 ? data[0].value : 0
          };
        })
      );
      
      // Sort by value (descending)
      dataPoints.sort((a, b) => b.value - a.value);
      
      comparisonChart.data.labels = dataPoints.map(d => d.country);
      comparisonChart.data.datasets = [{
        data: dataPoints.map(d => d.value),
        backgroundColor: dataPoints.map(d => getRandomColor()),
        borderColor: '#fff',
        borderWidth: 1
      }];
      
      comparisonChart.options.scales.y.title = {
        display: true,
        text: getAxisLabel(metric)
      };
      
      comparisonChart.options.plugins.title.text = `Country Comparison: ${getMetricName(metric)} (${year})`;
      comparisonChart.update();
      
      // Update the dashboard with additional metrics
      await updateComparisonDashboard(countries, year);
    } catch (error) {
      console.error('Error loading comparison data:', error);
    }
  }
  
  async function updateComparisonDashboard(selectedCountries, year = 2022) {
    if (!selectedCountries || selectedCountries.length === 0) return;
    
    try {
      document.getElementById('currentYearDisplay').textContent = year;
      
      // Fetch country data
      const countryData = await Promise.all(
        selectedCountries.map(async country => {
          const res = await fetch(`/api/emissions?country=${encodeURIComponent(country)}&startYear=${year}&endYear=${year}`);
          const data = await res.json();
          return data[0] || null;
        })
      ).then(results => results.filter(Boolean));
      
      // Update metrics table
      const tableBody = document.querySelector('#metricsTable tbody');
      tableBody.innerHTML = countryData.map(country => `
        <tr>
          <td><img src="/img/icons/flags/${country.iso_code?.toLowerCase() || 'default'}.png" width="20" class="me-2">${country.country}</td>
          <td class="text-end">${country.co2_per_gdp ? country.co2_per_gdp.toFixed(2) + ' kg/$' : 'N/A'}</td>
          <td class="text-end">${country.energy_per_gdp ? (country.energy_per_gdp * 1000).toFixed(0) + ' Wh/$' : 'N/A'}</td>
        </tr>
      `).join('');
      
      // Update trend chart
      const trendData = await Promise.all(
        selectedCountries.map(async country => {
          const res = await fetch(`/api/emissions?country=${encodeURIComponent(country)}&startYear=1990&endYear=${year}`);
          const data = await res.json();
          return {
            country: country,
            data: data.map(d => ({ year: d.year, change: d.co2_growth_prct }))
          };
        })
      );
      
      trendChart.data.labels = Array.from({length: year-1990+1}, (_, i) => 1990 + i);
      trendChart.data.datasets = trendData.map(data => ({
        label: data.country,
        data: data.data.map(d => d.change),
        borderColor: getRandomColor(),
        backgroundColor: 'transparent',
        tension: 0.1
      }));
      trendChart.update();
      
    } catch (error) {
      console.error('Error updating comparison dashboard:', error);
    }
  }

  // Helper functions
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
        y: {
          title: { display: true, text: yAxisTitle },
          beginAtZero: false
        },
        x: { title: { display: true, text: 'Year' } }
      }
    };
  }
  
  function getAxisLabel(metric) {
    const labels = {
      'co2': 'CO₂ Emissions (million tonnes)',
      'co2_per_capita': 'CO₂ Emissions (tonnes per person)',
      'share_global_co2': 'Share of Global Emissions (%)',
      'temperature_change_from_co2': 'Temperature Impact (°C)',
      'co2_per_gdp': 'CO₂ Intensity (kg per $)'
    };
    return labels[metric] || 'Value';
  }
  
  function getMetricName(metric) {
    const names = {
      'co2': 'Total CO₂ Emissions',
      'co2_per_capita': 'Per Capita CO₂',
      'share_global_co2': 'Global Share of CO₂',
      'temperature_change_from_co2': 'Temperature Impact',
      'co2_per_gdp': 'CO₂ Intensity'
    };
    return names[metric] || metric;
  }
  
  function getRandomColor() {
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  }
});