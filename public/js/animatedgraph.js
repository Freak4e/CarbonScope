// Define initGraph directly
const initGraph = function () {
  const playButton = document.getElementById('playPauseButton');
  const chartCanvas = document.getElementById('co2Chart');
  const startHandle = document.getElementById('startHandle');
  const endHandle = document.getElementById('endHandle');
  const interval = document.getElementById('interval');
  const startTooltip = document.getElementById('startTooltip');
  const endTooltip = document.getElementById('endTooltip');

  // Validate DOM elements
  if (!playButton || !chartCanvas || !startHandle || !endHandle || !interval || !startTooltip || !endTooltip) {
    console.error('Graph elements not found.');
    if (chartCanvas) {
      chartCanvas.parentElement.innerHTML = '<p style="color: red;">Napaka: Manjkajo elementi strani.</p>';
    }
    return;
  }

  let chartInstance = null;
  let animationInterval = null;
  let isPlaying = false;
  let currentYearIndex = 0;
  let startYearIndex = 0;
  let endYearIndex = 0;
  let chartData = [];

  // Fallback static data (derived from HTML chart-line and extended to 1750–2023)
  const fallbackData = [
    { year: 1750, co2: 0.01 },
    { year: 1800, co2: 0.03 },
    { year: 1850, co2: 0.20 },
    { year: 1900, co2: 2.00 },
    { year: 1950, co2: 6.00 },
    { year: 1970, co2: 15.00 },
    { year: 1980, co2: 19.40 },
    { year: 1990, co2: 22.70 },
    { year: 2000, co2: 25.10 },
    { year: 2002, co2: 26.20 },
    { year: 2004, co2: 28.10 },
    { year: 2006, co2: 30.40 },
    { year: 2008, co2: 31.70 },
    { year: 2010, co2: 33.10 },
    { year: 2012, co2: 34.50 },
    { year: 2014, co2: 35.30 },
    { year: 2016, co2: 35.80 },
    { year: 2018, co2: 36.60 },
    { year: 2020, co2: 34.80 },
    { year: 2022, co2: 36.80 },
    { year: 2023, co2: 37.40 },
  ];

  async function fetchData() {
    try {
      const response = await fetch('/api/animated-graph');
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      chartData = await response.json();
      chartData.sort((a, b) => a.year - b.year);
      if (chartData.length === 0) throw new Error('No data received.');
    } catch (error) {
      console.error('Error fetching animated graph data:', error);
      chartData = fallbackData;
      console.warn('Using fallback data for CO₂ emissions.');
    }
    endYearIndex = chartData.length - 1;
  }

  function initializeChart() {
    if (chartInstance) chartInstance.destroy();
    const ctx = chartCanvas.getContext('2d');
    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartData.slice(startYearIndex, endYearIndex + 1).map((d) => d.year),
        datasets: [
          {
            label: 'Globalne emisije CO₂ (milijarde ton)',
            data: chartData.slice(startYearIndex, endYearIndex + 1).map((d) => d.co2),
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          title: {
            display: true,
            text: `Emisije CO₂ od ${chartData[startYearIndex].year} do ${chartData[endYearIndex].year}`,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Leto',
            },
            ticks: {
              autoSkip: true,
              maxTicksLimit: 10,
            },
          },
          y: {
            title: {
              display: true,
              text: 'Milijarde ton CO₂',
            },
            beginAtZero: true,
          },
        },
        animation: {
          duration: 0,
        },
      },
    });
  }

  function updateChart(yearIndex) {
    if (!chartInstance || !chartData[yearIndex]) return;
    chartInstance.data.labels = chartData.slice(startYearIndex, yearIndex + 1).map((d) => d.year);
    chartInstance.data.datasets[0].data = chartData.slice(startYearIndex, yearIndex + 1).map((d) => d.co2);
    chartInstance.options.plugins.title.text = `Emisije CO₂ do leta ${chartData[yearIndex].year}`;
    chartInstance.update('none');
  }

  function startAnimation() {
    if (isPlaying) return;
    isPlaying = true;
    playButton.innerHTML = '<i class="fas fa-pause"></i>';
    startHandle.style.pointerEvents = 'none';
    endHandle.style.pointerEvents = 'none';

    chartInstance.data.labels = [chartData[startYearIndex].year];
    chartInstance.data.datasets[0].data = [chartData[startYearIndex].co2];
    chartInstance.options.plugins.title.text = `Emisije CO₂ do leta ${chartData[startYearIndex].year}`;
    chartInstance.update('none');

    const yearRange = endYearIndex - startYearIndex + 1;
    const baseDurationSec = Math.min(20, Math.max(5, yearRange * 0.2));
    const minIntervalMs = 50;
    let intervalMs = yearRange > 1 ? (baseDurationSec * 1000) / yearRange : 1000;
    intervalMs = Math.max(minIntervalMs, intervalMs);

    currentYearIndex = startYearIndex;
    updateChart(currentYearIndex);
    animationInterval = setInterval(() => {
      currentYearIndex++;
      if (currentYearIndex > endYearIndex) {
        stopAnimation();
        return;
      }
      updateChart(currentYearIndex);
    }, intervalMs);
  }

  function stopAnimation() {
    if (!isPlaying) return;
    isPlaying = false;
    clearInterval(animationInterval);
    playButton.innerHTML = '<i class="fas fa-play"></i>';
    startHandle.style.pointerEvents = 'auto';
    endHandle.style.pointerEvents = 'auto';
    chartInstance.data.labels = chartData.slice(startYearIndex, endYearIndex + 1).map((d) => d.year);
    chartInstance.data.datasets[0].data = chartData.slice(startYearIndex, endYearIndex + 1).map((d) => d.co2);
    chartInstance.options.plugins.title.text = `Emisije CO₂ od ${chartData[startYearIndex].year} do ${chartData[endYearIndex].year}`;
    chartInstance.update('none');
  }

  function resetGraphState() {
    stopAnimation();
    startYearIndex = 0;
    endYearIndex = chartData.length - 1;
    currentYearIndex = 0;
    startHandle.style.left = '0%';
    endHandle.style.left = '100%';
    interval.style.left = '0%';
    interval.style.right = '0%';
    startTooltip.style.display = 'none';
    endTooltip.style.display = 'none';
    startHandle.setAttribute('aria-valuenow', chartData[0].year);
    endHandle.setAttribute('aria-valuenow', chartData[chartData.length - 1].year);
    if (chartInstance) {
      chartInstance.data.labels = chartData.slice(startYearIndex, endYearIndex + 1).map((d) => d.year);
      chartInstance.data.datasets[0].data = chartData.slice(startYearIndex, endYearIndex + 1).map((d) => d.co2);
      chartInstance.options.plugins.title.text = `Emisije CO₂ od ${chartData[startYearIndex].year} do ${chartData[endYearIndex].year}`;
      chartInstance.update('none');
    }
  }

  function updateHandlePosition(e, handle, tooltip, isStart) {
    const slider = document.querySelector('.slider');
    if (!slider) {
      console.error('Slider element not found.');
      return;
    }
    const rect = slider.getBoundingClientRect();
    let x = e.clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width));
    const percent = (x / rect.width) * 100;
    const year = Math.round(1750 + (percent / 100) * (2023 - 1750));
    let yearIndex = chartData.findIndex((d) => d.year >= year);
    if (yearIndex === -1) yearIndex = chartData.length - 1;

    if (isStart) {
      if (yearIndex > endYearIndex) {
        yearIndex = endYearIndex;
        handle.style.left = endHandle.style.left;
      } else {
        handle.style.left = `${percent}%`;
        interval.style.left = `${percent}%`;
      }
      startYearIndex = yearIndex;
      startTooltip.textContent = chartData[startYearIndex].year;
      startTooltip.style.left = `${x}px`;
      startTooltip.style.display = 'block';
      handle.setAttribute('aria-valuenow', chartData[startYearIndex].year);
    } else {
      if (yearIndex < startYearIndex) {
        yearIndex = startYearIndex;
        handle.style.left = startHandle.style.left;
      } else {
        handle.style.left = `${percent}%`;
        interval.style.right = `${100 - percent}%`;
      }
      endYearIndex = yearIndex;
      endTooltip.textContent = chartData[endYearIndex].year;
      endTooltip.style.left = `${x}px`;
      endTooltip.style.display = 'block';
      handle.setAttribute('aria-valuenow', chartData[endYearIndex].year);
    }

    if (!isPlaying) {
      chartInstance.data.labels = chartData.slice(startYearIndex, endYearIndex + 1).map((d) => d.year);
      chartInstance.data.datasets[0].data = chartData.slice(startYearIndex, endYearIndex + 1).map((d) => d.co2);
      chartInstance.options.plugins.title.text = `Emisije CO₂ od ${chartData[startYearIndex].year} do ${chartData[endYearIndex].year}`;
      chartInstance.update('none');
    }
  }

  function setupHandleDragging(handle, tooltip, isStart) {
    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const onMouseMove = (e) => {
        updateHandlePosition(e, handle, tooltip, isStart);
      };
      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        tooltip.style.display = 'none';
      };
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    handle.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const onTouchMove = (e) => {
        if (e.touches.length > 0) {
          updateHandlePosition(e.touches[0], handle, tooltip, isStart);
        }
      };
      const onTouchEnd = () => {
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
        tooltip.style.display = 'none';
      };
      document.addEventListener('touchmove', onTouchMove);
      document.addEventListener('touchend', onTouchEnd);
    });

    handle.addEventListener('dragstart', (e) => {
      e.preventDefault();
    });
  }

  function downloadCSV(data, filename, headers, rowFormatter) {
    let csvContent = headers.join(',') + '\n';
    data.forEach((row) => {
      csvContent += rowFormatter(row) + '\n';
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

  window.downloadAnimatedGraphCSV = function () {
    if (chartData.length === 0) {
      alert('Podatki še niso naloženi. Počakajte trenutek in poskusite znova.');
      return;
    }
    downloadCSV(chartData, 'global_co2_emissions_over_time.csv', ['Year', 'CO2_Emissions_Billion_Tonnes'], (row) =>
      `${row.year},${row.co2.toFixed(2)}`
    );
  };

  setupHandleDragging(startHandle, startTooltip, true);
  setupHandleDragging(endHandle, endTooltip, false);

  playButton.addEventListener('click', () => {
    if (isPlaying) {
      stopAnimation();
    } else {
      startAnimation();
    }
  });

  async function initializeGraph() {
    if (chartData.length === 0) {
      await fetchData();
      if (chartData.length > 0) {
        initializeChart();
        resetGraphState();
      }
    }
  }

  initializeGraph();
};

// Expose initGraph globally for browser use
document.addEventListener('DOMContentLoaded', function () {
  window.initGraph = initGraph;

  document.getElementById('tabContent')?.addEventListener('tabContentLoaded', function (e) {
    if (e.detail.tab === 'overview-svet.html') {
      window.initGraph();
    }
  });
});

// Export for testing
module.exports = { initGraph };