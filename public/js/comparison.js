document.addEventListener('DOMContentLoaded', function() {
  let emissionsChart, comparisonChart;
  let emissionsData = [];

  function initDashboard() {
    const countrySelect = $('#countrySelect');
    const metricSelect = document.getElementById('metricSelect');
    const startYearInput = document.getElementById('startYearInput');
    const endYearInput = document.getElementById('endYearInput');
    const updateBtn = document.getElementById('updateBtn');
    const chartTitle = document.getElementById('chartTitle');
    let currentYear = 2022;

    // Check if required elements exist
    if (!countrySelect.length && !document.getElementById('emissionsChart')) {
      console.log('No comparison dashboard elements found, skipping initialization');
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

  // Function to generate and download CSV
  function downloadCSV(data, filename, headers, rowFormatter) {
    console.log('Generating CSV for:', filename, 'Data length:', data.length);
    let csvContent = headers.join(',') + '\n';
    data.forEach(row => {
      try {
        csvContent += rowFormatter(row) + '\n';
      } catch (error) {
        console.warn('Skipping invalid row:', row, 'Error:', error);
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

  // Download handler for emissions chart
  window.downloadEmissionsCSV = async function(dataType = 'displayed') {
    const selectedCountries = $('#countrySelect').val() || [];
    const metric = document.getElementById('metricSelect')?.value || 'co2';
    const startYear = document.getElementById('startYearInput')?.value || 1990;
    const endYear = document.getElementById('endYearInput')?.value || 2022;

    if (dataType === 'all') {
      try {
        const csvUrl = '/data';
        const link = document.createElement('a');
        link.setAttribute('href', csvUrl);
        link.setAttribute('download', 'co2-data.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('Triggered download for:', csvUrl);
      } catch (error) {
        console.error('Error downloading full CSV:', error);
        alert('Napaka pri prenosu celotnih podatkov. Preverite, ali je datoteka na voljo.');
      }
    } else {
      // Use displayed data
      if (emissionsData.length === 0) {
        alert('Podatki še niso naloženi ali ni izbranih držav. Posodobite graf in poskusite znova.');
        return;
      }
      if (selectedCountries.length === 0) {
        alert('Izberite vsaj eno državo za prenos prikazanih podatkov.');
        return;
      }

      const metricLabel = getMetricName(metric);
      const unit = getAxisLabel(metric).match(/\(([^)]+)\)/)?.[1] || 'Value';
      const filename = `Emissions_${metricLabel.replace(/\s/g, '')}_${startYear}-${endYear}.csv`;
      const headers = ['Year', 'Country', `${metricLabel.replace(/\s/g, '_')}_${unit.replace(/\s/g, '')}`];
      const rowFormatter = data => `${data.year},${data.country},${data.value !== null ? data.value.toFixed(2) : '0.00'}`;

      downloadCSV(emissionsData, filename, headers, rowFormatter);
    }
  };

  async function updateAllCharts() {
    const selectedCountries = $('#countrySelect').val() || [];
    const metric = document.getElementById('metricSelect')?.value || 'co2';
    const startYear = document.getElementById('startYearInput')?.value || 1990;
    const endYear = document.getElementById('endYearInput')?.value || 2022;

    if (emissionsChart) await updateEmissionsChart(selectedCountries, metric, startYear, endYear);
    if (comparisonChart) await updateComparisonChart(selectedCountries, metric, endYear);
  }

  async function updateEmissionsChart(countries, metric, startYear, endYear) {
    if (!emissionsChart) return;

    const datasets = [];
    let labels = [];
    emissionsData = []; // Reset data for CSV download

    for (const country of countries) {
      try {
        const response = await fetch(`/api/emissions?country=${encodeURIComponent(country)}&metric=${metric}&startYear=${startYear}&endYear=${endYear}`);
        if (!response.ok) throw new Error(`Network response was not ok: ${response.status}`);
        const data = await response.json();
        console.log(`Data for ${country}:`, data);

        if (data && data.length > 0) {
          if (labels.length === 0) labels = data.map(d => d.year).filter(year => year != null);
          datasets.push({
            label: country,
            data: data.map(d => d.value != null ? d.value : 0),
            borderColor: getRandomColor(),
            backgroundColor: 'transparent',
            borderWidth: 2,
            fill: false,
            tension: 0.1
          });
          emissionsData.push(...data.filter(d => d.year != null && d.country != null && d.value != null));
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
    console.log('Emissions data for CSV:', emissionsData);
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
      'share_global_co2': 'Delež v svetu (%)',
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
    if (e.detail.tab === 'comparison.html') {
      initDashboard();
    }
  });

  // Initialize if already on the comparison tab
  if (document.getElementById('emissionsChart') || document.getElementById('comparisonChart')) {
    initDashboard();
  }
});