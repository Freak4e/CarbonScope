document.addEventListener('DOMContentLoaded', function () {
  // Function to fetch and process data for global emissions chart
  async function loadGlobalEmissionsChart() {
    try {
      const response = await fetch('/api/global-emissions?startYear=2000&endYear=2100');
      const data = await response.json();

      // Separate historical (≤2023) and predicted (>2023) data
      const historicalData = data.filter(d => d.year <= 2023);
      const predictedData = data.filter(d => d.year >= 2023); // Include 2023 for continuity

      // Chart.js configuration for global emissions
      const ctx = document.getElementById('futureEmissionsLongTermChart').getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          datasets: [
            {
              label: 'Global CO₂ Emissions (Gt)',
              data: data.map(d => ({ x: d.year, y: d.co2 })),
              borderColor: '#5e72e4',
              backgroundColor: 'rgba(94, 114, 228, 0.1)',
              fill: false,
              tension: 0.1,
              pointRadius: 0,
            },
            {
              label: 'Upper Bound (Predicted)',
              data: predictedData.map(d => ({ x: d.year, y: d.upper_bound })),
              borderColor: 'rgba(255, 99, 132, 0.5)',
              backgroundColor: 'rgba(255, 99, 132, 0.1)',
              fill: '+1', // Fill to the next dataset (lower bound)
              tension: 0.1,
              pointRadius: 0,
              borderDash: [5, 5],
            },
            {
              label: 'Lower Bound (Predicted)',
              data: predictedData.map(d => ({ x: d.year, y: d.lower_bound })),
              borderColor: 'rgba(75, 192, 192, 0.5)',
              backgroundColor: 'rgba(75, 192, 192, 0.1)',
              fill: false,
              tension: 0.1,
              pointRadius: 0,
              borderDash: [5, 5],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false, // Allow custom height
          scales: {
            x: {
              type: 'linear',
              title: { display: true, text: 'Year' },
              min: 2000,
              max: 2100,
              ticks: {
                callback: function(value) {
                  return Math.floor(value); // Ensure whole numbers
                },
              },
            },
            y: {
              title: { display: true, text: 'CO₂ Emissions (Gt)' },
              beginAtZero: false,
            },
          },
          plugins: {
            legend: { display: true },
            tooltip: {
              enabled: true,
              mode: 'nearest', // Show tooltip for nearest point
              intersect: false, // Allow tooltip when hovering in area, not just on line
              callbacks: {
                title: function(tooltipItems) {
                  const year = Math.floor(tooltipItems[0].parsed.x);
                  return `Year: ${year}`;
                },
                label: function(context) {
                  const year = Math.floor(context.parsed.x);
                  const datasetLabel = context.dataset.label || '';
                  let label = `${datasetLabel}: ${context.parsed.y.toFixed(2)} Gt`;
                  
                  // For predicted years (>2023), show all three values when hovering
                  if (year > 2023) {
                    const datasetIndex = context.datasetIndex;
                    const dataPoint = context.chart.data.datasets[0].data.find(d => d.x === year);
                    const upperBound = context.chart.data.datasets[1].data.find(d => d.x === year);
                    const lowerBound = context.chart.data.datasets[2].data.find(d => d.x === year);
                    
                    if (datasetIndex === 0) { // Main CO₂ line
                      return [
                        `CO₂ Emissions: ${dataPoint.y.toFixed(2)} Gt`,
                        `Upper Bound: ${upperBound.y.toFixed(2)} Gt`,
                        `Lower Bound: ${lowerBound.y.toFixed(2)} Gt`
                      ];
                    }
                    return label; // For upper/lower bound lines, show only their value
                  }
                  return label; // For historical data, show only the hovered dataset
                },
              },
            },
            annotation: {
              annotations: {
                line2023: {
                  type: 'line',
                  xMin: 2023,
                  xMax: 2023,
                  borderColor: 'rgba(0, 0, 0, 0.5)',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  label: {
                    content: '2023',
                    enabled: true,
                    position: 'top',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    color: '#fff',
                  },
                },
              },
            },
          },
        },
      });
    } catch (error) {
      console.error('Error loading global emissions chart:', error);
    }
  }

  // Function to fetch and process data for Slovenia emissions chart
  async function loadSloveniaEmissionsChart() {
    try {
      const response = await fetch('/api/slovenia-emissions?startYear=2000&endYear=2100');
      const data = await response.json();

      // Separate historical (≤2023) and predicted (>2023) data
      const historicalData = data.filter(d => d.year <= 2023);
      const predictedData = data.filter(d => d.year >= 2023); // Include 2023 for continuity

      // Chart.js configuration for Slovenia emissions
      const ctx = document.getElementById('sloveniaEmissionsChart').getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          datasets: [
            {
              label: 'Slovenia CO₂ Emissions (Gt)',
              data: data.map(d => ({ x: d.year, y: d.co2 })),
              borderColor: '#5e72e4',
              backgroundColor: 'rgba(94, 114, 228, 0.1)',
              fill: false,
              tension: 0.1,
              pointRadius: 0,
            },
            {
              label: 'Upper Bound (Predicted)',
              data: predictedData.map(d => ({ x: d.year, y: d.upper_bound })),
              borderColor: 'rgba(255, 99, 132, 0.5)',
              backgroundColor: 'rgba(255, 99, 132, 0.1)',
              fill: '+1', // Fill to the next dataset (lower bound)
              tension: 0.1,
              pointRadius: 0,
              borderDash: [5, 5],
            },
            {
              label: 'Lower Bound (Predicted)',
              data: predictedData.map(d => ({ x: d.year, y: d.lower_bound })),
              borderColor: 'rgba(75, 192, 192, 0.5)',
              backgroundColor: 'rgba(75, 192, 192, 0.1)',
              fill: false,
              tension: 0.1,
              pointRadius: 0,
              borderDash: [5, 5],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false, // Allow custom height
          scales: {
            x: {
              type: 'linear',
              title: { display: true, text: 'Year' },
              min: 2000,
              max: 2100,
              ticks: {
                callback: function(value) {
                  return Math.floor(value); // Ensure whole numbers
                },
              },
            },
            y: {
              title: { display: true, text: 'CO₂ Emissions (Gt)' },
              beginAtZero: true,
            },
          },
          plugins: {
            legend: { display: true },
            tooltip: {
              enabled: true,
              mode: 'nearest', // Show tooltip for nearest point
              intersect: false, // Allow tooltip when hovering in area
              callbacks: {
                title: function(tooltipItems) {
                  const year = Math.floor(tooltipItems[0].parsed.x);
                  return `Year: ${year}`;
                },
                label: function(context) {
                  const year = Math.floor(context.parsed.x);
                  const datasetLabel = context.dataset.label || '';
                  let label = `${datasetLabel}: ${context.parsed.y.toFixed(4)} Gt`;
                  
                  // For predicted years (>2023), show all three values when hovering
                  if (year > 2023) {
                    const datasetIndex = context.datasetIndex;
                    const dataPoint = context.chart.data.datasets[0].data.find(d => d.x === year);
                    const upperBound = context.chart.data.datasets[1].data.find(d => d.x === year);
                    const lowerBound = context.chart.data.datasets[2].data.find(d => d.x === year);
                    
                    if (datasetIndex === 0) { // Main CO₂ line
                      return [
                        `CO₂ Emissions: ${dataPoint.y.toFixed(4)} Gt`,
                        `Upper Bound: ${upperBound.y.toFixed(4)} Gt`,
                        `Lower Bound: ${lowerBound.y.toFixed(4)} Gt`
                      ];
                    }
                    return label; // For upper/lower bound lines, show only their value
                  }
                  return label; // For historical data, show only the hovered dataset
                },
              },
            },
            annotation: {
              annotations: {
                line2023: {
                  type: 'line',
                  xMin: 2023,
                  xMax: 2023,
                  borderColor: 'rgba(0, 0, 0, 0.5)',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  label: {
                    content: '2023',
                    enabled: true,
                    position: 'top',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    color: '#fff',
                  },
                },
              },
            },
          },
        },
      });
    } catch (error) {
      console.error('Error loading Slovenia emissions chart:', error);
    }
  }

  // Initialize both charts
  loadGlobalEmissionsChart();
  loadSloveniaEmissionsChart();
});