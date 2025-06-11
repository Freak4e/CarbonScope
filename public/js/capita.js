async function initializePerCapitaCharts() {
    console.log('Initializing Per Capita CO2 charts...');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const contentContainer = document.getElementById('contentContainer');

    if (!loadingIndicator || !contentContainer) {
        throw new Error('Required DOM elements missing');
    }

    let chartInstance = null;
    let animationInterval = null;
    let isPlaying = false;
    let currentYearIndex = 0;
    let sloveniaData = [];

    try {
        // Fetch data
        const [sloResponse, euResponse, worldResponse] = await Promise.all([
            fetch('/api/emissions?country=Slovenia&metric=co2_per_capita&startYear=1991&endYear=2023'),
            fetch('/api/emissions?country=European+Union+%2827%29&metric=co2_per_capita&startYear=2000&endYear=2022'),
            fetch('/api/emissions?country=World&metric=co2_per_capita&startYear=2000&endYear=2022')
        ]);

        if (!sloResponse.ok || !euResponse.ok || !worldResponse.ok) {
            throw new Error('Failed to fetch data from one or more APIs');
        }

        const [sloData, euData, worldData] = await Promise.all([
            sloResponse.json(),
            euResponse.json(),
            worldResponse.json()
        ]);

        // Validate data
        if (!Array.isArray(sloData) || !Array.isArray(euData) || !Array.isArray(worldData)) {
            throw new Error('Invalid data format received from API');
        }

        // Fallback data
        sloveniaData = sloData.length ? sloData : Array.from({ length: 33 }, (_, i) => ({
            year: 1991 + i,
            co2_per_capita: i < 9 ? 10.0 - (10.0 - 9.03) * (i / 8) : 9.03 - (9.03 - 6.0) * ((i - 9) / 23),
            population: 2000000,
            gdp: 25000000000 + i * 1000000000
        }));
        const euDataFallback = euData.length ? euData : Array.from({ length: 23 }, (_, i) => ({
            year: 2000 + i,
            co2_per_capita: 6.4
        }));
        const worldDataFallback = worldData.length ? worldData : Array.from({ length: 23 }, (_, i) => ({
            year: 2000 + i,
            co2_per_capita: 4.7
        }));

        // Calculate statistics
        const values = sloveniaData.map(d => d.co2_per_capita).filter(v => typeof v === 'number');
        const avgEmissions = values.length ? (values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(2) : '-';
        const medianEmissions = values.length ? values.sort((a, b) => a - b)[Math.floor(values.length / 2)].toFixed(2) : '-';
        const changeEmissions = values.length >= 2 ? ((values[values.length - 1] - values[0]) / values[0] * 100).toFixed(1) : '-';
        const cumulativeEmissions = values.length ? values.reduce((sum, v) => sum + v, 0).toFixed(1) : '-';

        // Update statistical highlights
        document.getElementById('avgEmissions').textContent = `${avgEmissions} t`;
        document.getElementById('medianEmissions').textContent = `${medianEmissions} t`;
        document.getElementById('changeEmissions').textContent = `${changeEmissions}%`;
        document.getElementById('cumulativeEmissions').textContent = `${cumulativeEmissions} t`;

        // Show content
        loadingIndicator.style.display = 'none';
        contentContainer.style.display = 'block';

        // Trend Line Chart
        const trendCtx = document.getElementById('trend_chart')?.getContext('2d');
        if (trendCtx) {
            chartInstance = new Chart(trendCtx, {
                type: 'line',
                data: {
                    labels: sloveniaData.map(d => d.year),
                    datasets: [{
                        label: 'Ton CO₂ na prebivalca',
                        data: sloveniaData.map(d => d.co2_per_capita),
                        borderColor: '#20c997',
                        backgroundColor: 'rgba(32, 201, 151, 0.2)',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'top' },
                        title: {
                            display: true,
                            text: 'Emisije CO₂ na prebivalca (1991–2023)'
                        },
                        tooltip: {
                            callbacks: {
                                label: ctx => `${ctx.parsed.y.toFixed(2)} t/osebo`,
                                afterLabel: ctx => {
                                    const i = ctx.dataIndex;
                                    const change = i > 0 ? ((sloveniaData[i].co2_per_capita - sloveniaData[i - 1].co2_per_capita) / sloveniaData[i - 1].co2_per_capita * 100).toFixed(1) : '-';
                                    return `Sprememba: ${change}%`;
                                }
                            }
                        },
                        annotation: {
                            annotations: {
                                independence1991: {
                                    type: 'line',
                                    xMin: 1991,
                                    xMax: 1991,
                                    borderColor: 'rgba(255, 99, 132, 0.7)',
                                    borderWidth: 1,
                                    label: {
                                        content: 'Osamosvojitev',
                                        display: true,
                                        position: 'top',
                                        backgroundColor: 'rgba(255, 99, 132, 0.8)',
                                        color: 'white',
                                        font: { size: 10 },
                                        padding: 4
                                    }
                                },
                                crisis2008: {
                                    type: 'line',
                                    xMin: 2008,
                                    xMax: 2008,
                                    borderColor: 'rgba(255, 99, 132, 0.7)',
                                    borderWidth: 1,
                                    label: {
                                        content: 'Finančna kriza',
                                        display: true,
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
                                        content: 'Pandemija',
                                        display: true,
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
                        y: { title: { display: true, text: 'Ton CO₂ na prebivalca' }, beginAtZero: true },
                        x: { title: { display: true, text: 'Leto' } }
                    },
                    animation: { duration: 0 }
                }
            });

            // Animation functions
            function updateChart(yearIndex) {
                if (!chartInstance || !sloveniaData[yearIndex]) return;
                chartInstance.data.labels = sloveniaData.slice(0, yearIndex + 1).map(d => d.year);
                if (!chartInstance.data.datasets[0]) {
                    chartInstance.data.datasets = [{
                        label: 'Ton CO₂ na prebivalca',
                        data: sloveniaData.slice(0, yearIndex + 1).map(d => d.co2_per_capita),
                        borderColor: '#20c997',
                        backgroundColor: 'rgba(32, 201, 151, 0.2)',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }];
                } else {
                    chartInstance.data.datasets[0].data = sloveniaData.slice(0, yearIndex + 1).map(d => d.co2_per_capita);
                }
                chartInstance.options.plugins.title = {
                    display: true,
                    text: `Emisije CO₂ na prebivalca do leta ${sloveniaData[yearIndex].year}`
                };
                chartInstance.update('none');
            }

            function startAnimation() {
                if (!chartInstance || isPlaying) return;
                isPlaying = true;
                const playButton = document.getElementById('playButton');
                const stopButton = document.getElementById('stopButton');
                playButton.innerHTML = '<i class="fas fa-pause"></i> Zaustavi';
                playButton.classList.replace('btn-primary', 'btn-warning');
                stopButton.disabled = false;
                    stopButton.disabled = false;
                currentYearIndex = 0;
                chartInstance.data.labels = [sloveniaData[0].year];
                if (!chartInstance.data.datasets[0]) {
                    chartInstance.data.datasets = [{
                        label: 'Ton CO₂ na prebivalca',
                        data: [sloveniaData[0].co2_per_capita],
                        borderColor: '#20c997',
                        backgroundColor: 'rgba(32, 201, 151, 0.2)',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }];
                } else {
                    chartInstance.data.datasets[0].data = [sloveniaData[0].co2_per_capita];
                }
                chartInstance.options.plugins.title = {
                    display: true,
                    text: `Emisije CO₂ na prebivalca do leta ${sloveniaData[0].year}`
                };
                chartInstance.update('none');
                const yearRange = sloveniaData.length;
                const baseDurationMs = 5000;
                const minIntervalMs = 20;
                let intervalMs = yearRange > 1 ? (baseDurationMs / yearRange) : 1000;
                intervalMs = Math.max(minIntervalMs, intervalMs);
                animationInterval = setInterval(() => {
                    currentYearIndex++;
                    if (currentYearIndex >= sloveniaData.length) {
                        stopAnimation();
                        return;
                    }
                    updateChart(currentYearIndex);
                }, intervalMs);
            }

            function stopAnimation() {
                if (!chartInstance || !isPlaying) return;
                isPlaying = false;
                clearInterval(animationInterval);
                const playButton = document.getElementById('playButton');
                const stopButton = document.getElementById('stopButton');
                playButton.innerHTML = '<i class="fas fa-play"></i> Predvajaj';
                playButton.classList.replace('btn-warning', 'btn-primary');
                stopButton.disabled = true;
                chartInstance.data.labels = sloveniaData.map(d => d.year);
                if (!chartInstance.data.datasets[0]) {
                    chartInstance.data.datasets = [{
                        label: 'Ton CO₂ na prebivalca',
                        data: sloveniaData.map(d => d.co2_per_capita),
                        borderColor: '#20c997',
                        backgroundColor: 'rgba(32, 201, 151, 0.2)',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }];
                } else {
                    chartInstance.data.datasets[0].data = sloveniaData.map(d => d.co2_per_capita);
                }
                chartInstance.options.plugins.title = {
                    display: true,
                    text: 'Emisije CO₂ na prebivalca (1991–2023)'
                };
                chartInstance.update('none');
            }

            // Button event listeners
            const playButton = document.getElementById('playButton');
            const stopButton = document.getElementById('stopButton');
            if (playButton && stopButton) {
                playButton.addEventListener('click', () => {
                    if (isPlaying) stopAnimation();
                    else startAnimation();
                });
                stopButton.addEventListener('click', stopAnimation);
                stopButton.disabled = true;
            } else {
                console.error('Play or stop button not found');
            }
        } else {
            console.error('Trend chart canvas not found');
        }

        // Comparison Bar Chart
        const compCtx = document.getElementById('comparisonChart')?.getContext('2d');
        if (compCtx) {
            new Chart(compCtx, {
                type: 'bar',
                data: {
                    labels: ['Slovenija', 'EU', 'Svet'],
                    datasets: [{
                        label: 'CO₂ na prebivalca (t)',
                        data: [
                            sloveniaData.find(d => d.year === 2022)?.co2_per_capita || 6.0,
                            euDataFallback.find(d => d.year === 2022)?.co2_per_capita || 6.4,
                            worldDataFallback.find(d => d.year === 2022)?.co2_per_capita || 4.7
                        ],
                        backgroundColor: ['rgba(32, 201, 151, 0.7)', 'rgba(111, 66, 193, 0.7)', 'rgba(253, 126, 20, 0.7)'],
                        borderColor: ['#20c997', '#6f42c1', '#fd7e14'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: {
                            callbacks: {
                                label: ctx => `${ctx.parsed.y.toFixed(2)} t/osebo`
                            }
                        }
                    },
                    scales: {
                        y: { title: { display: true, text: 'Ton CO₂ na prebivalca' }, beginAtZero: true },
                        x: { title: { display: true, text: 'Regija' } }
                    }
                }
            });
        } else {
            console.error('Comparison chart canvas not found');
        }

        // Rolling Average Line Chart
        const rollingCtx = document.getElementById('rollingAverageChart')?.getContext('2d');
        if (rollingCtx) {
            const rollingAvg = sloveniaData.map((_, i, arr) => {
                if (i < 4) return null;
                const slice = arr.slice(i - 4, i + 1).map(d => d.co2_per_capita);
                return slice.reduce((sum, v) => sum + v, 0) / slice.length;
            }).filter(v => v !== null);
            new Chart(rollingCtx, {
                type: 'line',
                data: {
                    labels: sloveniaData.slice(4).map(d => d.year),
                    datasets: [{
                        label: '5-letno drseče povprečje',
                        data: rollingAvg,
                        borderColor: '#6f42c1',
                        backgroundColor: 'rgba(111, 66, 193, 0.2)',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: {
                            callbacks: {
                                label: ctx => `${ctx.parsed.y.toFixed(2)} t/osebo`
                            }
                        }
                    },
                    scales: {
                        y: { title: { display: true, text: 'Ton CO₂ na prebivalca' }, beginAtZero: true },
                        x: { title: { display: true, text: 'Leto' } }
                    }
                }
            });
        } else {
            console.error('Rolling average chart canvas not found');
        }

        // Year-over-Year Change Bar Chart
        const changeCtx = document.getElementById('yearlyChangeChart')?.getContext('2d');
        if (changeCtx) {
            const changes = sloveniaData.slice(1).map((d, i) => ({
                year: d.year,
                change: ((d.co2_per_capita - sloveniaData[i].co2_per_capita) / sloveniaData[i].co2_per_capita * 100).toFixed(1)
            }));
            new Chart(changeCtx, {
                type: 'bar',
                data: {
                    labels: changes.map(d => d.year),
                    datasets: [{
                        label: 'Letna sprememba (%)',
                        data: changes.map(d => parseFloat(d.change)),
                        backgroundColor: changes.map(d => d.change >= 0 ? 'rgba(253, 126, 20, 0.7)' : 'rgba(255, 107, 107, 0.7)'),
                        borderColor: changes.map(d => d.change >= 0 ? '#fd7e14' : '#ff6b6b'),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: {
                            callbacks: {
                                label: ctx => `${ctx.parsed.y.toFixed(1)}%`
                            }
                        }
                    },
                    scales: {
                        y: { title: { display: true, text: 'Sprememba (%)' }, beginAtZero: false },
                        x: { title: { display: true, text: 'Leto' } }
                    }
                }
            });
        } else {
            console.error('Year-on-year change chart canvas not found');
        }

        // Cumulative Emissions Area Chart
        const cumulativeCtx = document.getElementById('cumulativeChart')?.getContext('2d');
        if (cumulativeCtx) {
            const cumulativeData = sloveniaData.map((_, i) => sloveniaData.slice(0, i + 1).reduce((sum, d) => sum + (d.co2_per_capita || 0), 0));
            new Chart(cumulativeCtx, {
                type: 'line',
                data: {
                    labels: sloveniaData.map(d => d.year),
                    datasets: [{
                        label: 'Kumulativne emisije (t)',
                        data: cumulativeData,
                        borderColor: '#ff6b6b',
                        backgroundColor: 'rgba(255, 107, 107, 0.2)',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: {
                            callbacks: {
                                label: ctx => `${ctx.parsed.y.toFixed(2)} t`
                            }
                        }
                    },
                    scales: {
                        y: { title: { display: true, text: 'Kumulativne ton CO₂ na prebivalca' }, beginAtZero: true },
                        x: { title: { display: true, text: 'Leto' } }
                    }
                }
            });
        } else {
            console.error('Cumulative emissions chart canvas not found');
        }

        // Download handler
        window.downloadPerCapitaSloCSV = function() {
            if (!sloveniaData.length || !sloveniaData.every(row => row.year && typeof row.co2_per_capita === 'number')) {
                alert('Podatki še niso naloženi ali so neveljavni. Počakajte trenutek in poskusite znova.');
                return;
            }
            downloadCSV(
                sloveniaData,
                'slovenija_co2_na_prebivalca_1991-2023.csv',
                ['Leto', 'CO2_na_prebivalca_t'],
                row => `${row.year},${row.co2_per_capita.toFixed(2)}`
            );
        };

    } catch (error) {
        loadingIndicator.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle fa-sm me-2"></i>
                Napaka: ${error.message}
            </div>
        `;
        console.error('Error initializing charts:', error);
    }
}

function downloadCSV(data, filename, headers, rowFormatter) {
    let csvContent = headers.join(',') + '\n';
    data.forEach(row => {
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

// Expose initialization function
window.initializePerCapitaCharts = initializePerCapitaCharts;

// Initialize when DOM is ready
function ensureDOMReady(callback) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(callback, 0);
    } else {
        document.addEventListener('DOMContentLoaded', callback);
    }
}

ensureDOMReady(() => {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        initializePerCapitaCharts();
    } else {
        console.warn('Loading indicator not found, retrying in 100ms...');
        setTimeout(() => ensureDOMReady(() => initializePerCapitaCharts()), 100);
    }
});