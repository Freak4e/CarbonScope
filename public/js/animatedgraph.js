document.addEventListener('DOMContentLoaded', function () {
    const playButton = document.getElementById('playPauseButton');
    const chartCanvas = document.getElementById('co2Chart');
    const graphTab = document.getElementById('graph-tab');
    const startHandle = document.getElementById('startHandle');
    const endHandle = document.getElementById('endHandle');
    const interval = document.getElementById('interval');
    const startTooltip = document.getElementById('startTooltip');
    const endTooltip = document.getElementById('endTooltip');
    const closeMapPopup = document.getElementById('closeMapPopup');
    let chartInstance = null;
    let animationInterval = null;
    let isPlaying = false;
    let currentYearIndex = 0;
    let startYearIndex = 0;
    let endYearIndex = 0;
    let chartData = [];

    // Validate DOM elements
    if (!playButton || !chartCanvas || !graphTab || !startHandle || !endHandle || !interval || !startTooltip || !endTooltip || !closeMapPopup) {
        console.error('Graph elements not found.');
        return;
    }

    async function fetchData() {
        try {
            const response = await fetch('/api/animated-graph');
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            chartData = await response.json();
            chartData.sort((a, b) => a.year - b.year);
            if (chartData.length === 0) throw new Error('No data received.');
            endYearIndex = chartData.length - 1;
        } catch (error) {
            console.error('Error fetching animated graph data:', error);
            chartCanvas.parentElement.innerHTML = '<p style="color: red;">Napaka pri nalaganju podatkov o CO₂.</p>';
        }
    }

    function initializeChart() {
        if (chartInstance) chartInstance.destroy();
        const ctx = chartCanvas.getContext('2d');
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [chartData[startYearIndex].year],
                datasets: [{
                    label: 'Globalne emisije CO₂ (milijarde ton)',
                    data: [chartData[startYearIndex].co2],
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: `Emisije CO₂ do leta ${chartData[startYearIndex].year}`
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Leto'
                        },
                        ticks: {
                            autoSkip: true,
                            maxTicksLimit: 10
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Milijarde ton CO₂'
                        },
                        beginAtZero: true
                    }
                },
                animation: {
                    duration: 0
                }
            }
        });
    }

    function updateChart(yearIndex) {
        if (!chartInstance || !chartData[yearIndex]) return;
        chartInstance.data.labels = chartData.slice(startYearIndex, yearIndex + 1).map(d => d.year);
        chartInstance.data.datasets[0].data = chartData.slice(startYearIndex, yearIndex + 1).map(d => d.co2);
        chartInstance.options.plugins.title.text = `Emisije CO₂ do leta ${chartData[yearIndex].year}`;
        chartInstance.update('none');
    }

    function startAnimation() {
        if (isPlaying) return;
        isPlaying = true;
        playButton.innerHTML = '<i class="fas fa-pause"></i>';
        startHandle.style.pointerEvents = 'none';
        endHandle.style.pointerEvents = 'none';
        const yearRange = endYearIndex - startYearIndex + 1;
        const baseDurationMs = 20000; // 20s for full range
        const minIntervalMs = 50; // Minimum 50ms per year for smoothness
        let intervalMs = yearRange > 1 ? (baseDurationMs / yearRange) : 1000; // 1s for single year
        intervalMs = Math.max(minIntervalMs, intervalMs); // Cap interval for speed
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
        startHandle.setAttribute('aria-valuenow', '1750');
        endHandle.setAttribute('aria-valuenow', '2023');
        if (chartInstance) {
            updateChart(0);
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
        let yearIndex = chartData.findIndex(d => d.year >= year);
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
            currentYearIndex = startYearIndex;
            updateChart(currentYearIndex);
        }
    }

    function setupHandleDragging(handle, tooltip, isStart) {
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            console.log(`${isStart ? 'startHandle' : 'endHandle'} mousedown`);
            const onMouseMove = (e) => {
                console.log(`${isStart ? 'startHandle' : 'endHandle'} mousemove`, e.clientX);
                updateHandlePosition(e, handle, tooltip, isStart);
            };
            const onMouseUp = () => {
                console.log(`${isStart ? 'startHandle' : 'endHandle'} mouseup`);
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                tooltip.style.display = 'none';
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        handle.addEventListener('touchstart', (e) => {
            e.preventDefault();
            console.log(`${isStart ? 'startHandle' : 'endHandle'} touchstart`);
            const onTouchMove = (e) => {
                if (e.touches.length > 0) {
                    console.log(`${isStart ? 'startHandle' : 'endHandle'} touchmove`, e.touches[0].clientX);
                    updateHandlePosition(e.touches[0], handle, tooltip, isStart);
                }
            };
            const onTouchEnd = () => {
                console.log(`${isStart ? 'startHandle' : 'endHandle'} touchend`);
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

    setupHandleDragging(startHandle, startTooltip, true);
    setupHandleDragging(endHandle, endTooltip, false);

    playButton.addEventListener('click', () => {
        if (isPlaying) {
            stopAnimation();
        } else {
            startAnimation();
        }
    });

    graphTab.addEventListener('click', async () => {
        resetGraphState();
        if (!chartInstance && chartData.length === 0) {
            await fetchData();
            if (chartData.length > 0) {
                initializeChart();
            }
        }
        document.getElementById('legendContainer').style.display = 'none';
    });

    closeMapPopup.addEventListener('click', () => {
        resetGraphState();
    });

    document.getElementById('map-tab').addEventListener('click', () => {
        document.getElementById('legendContainer').style.display = 'block';
    });
});