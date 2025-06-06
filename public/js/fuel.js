async function initializeFuelCharts() {
    console.log('Inicializacija grafikonov CO₂ emisij po gorivih...');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const contentContainer = document.getElementById('contentContainer');

    try {
       
        const response = await fetch('/api/emissions-by-fuel-comparison');
        if (!response.ok) throw new Error('Failed to fetch fuel emissions data');
        const comparisonData = await response.json();

        if (!Array.isArray(comparisonData)) {
            throw new Error('Invalid data format from API');
        }

        // Fetch Slovenia-specific data for other charts
        const sloResponse = await fetch('/api/emissions-by-fuel-extended');
        if (!sloResponse.ok) throw new Error('Failed to fetch Slovenia fuel data');
        const fuelData = await sloResponse.json();

        // Process Slovenia data
        const fuelTypes = [...new Set(fuelData.map(d => d.fuel === 'Natural gas' ? 'Zemeljski plin' : d.fuel))];
        const sloYears = [...new Set(fuelData.map(d => d.year))].sort((a, b) => a - b);
        const sloData = fuelData.length ? fuelData : [];

        // Mock population data for Slovenia (in millions)
        const populationData = sloYears.reduce((acc, year) => {
            acc[year] = 2 + (year - 1991) * 0.002; 
            return acc;
        }, {});

        // Process Slovenia data with per capita calculations
        const sloGroupedByYear = sloYears.reduce((acc, year) => {
            acc[year] = sloData.filter(d => d.year === year).map(d => ({
                ...d,
                perCapita: d.value / populationData[year]
            }));
            return acc;
        }, {});

        
        const latestYearData = sloGroupedByYear[2022] || [];
        const dominantFuel = latestYearData.reduce((max, d) =>
            (d.perCapita || 0) > (max?.perCapita || 0) ? d : max, latestYearData[0] || {}).fuel || 'N/A';
        const oilEmissions = sloData.filter(d => d.fuel === 'Nafta' && d.year >= 2000 && d.year <= 2022);
        const changeEmissions = oilEmissions.length >= 2 ?
            ((oilEmissions[oilEmissions.length - 1].value / populationData[2022] - oilEmissions[0].value / populationData[2000]) / (oilEmissions[0].value / populationData[2000]) * 100).toFixed(1) : '-';
        const oilShare = latestYearData.reduce((sum, d) =>
            d.fuel === 'Nafta' ? sum + (d.perCapita || 0) : sum, 0) /
            (latestYearData.reduce((sum, d) => sum + (d.perCapita || 0), 0) || 1) * 100;

        
        
        document.getElementById('dominantFuel').textContent = dominantFuel;
        document.getElementById('changeEmissions').textContent = `${changeEmissions}%`;
        document.getElementById('oilShare').textContent = `${oilShare.toFixed(1)}%`;

        
        loadingIndicator.style.display = 'none';
        contentContainer.style.display = 'block';

        
        const colorMap = {
            'Premog': { bg: 'rgba(111, 66, 193, 0.6)', border: '#6f42c1', label: 'Premog' },
            'Nafta': { bg: 'rgba(32, 201, 151, 0.6)', border: '#20c997', label: 'Nafta' },
            'Zemeljski plin': { bg: 'rgba(253, 126, 20, 0.6)', border: '#fd7e14', label: 'Zemeljski plin' },
            'Cement': { bg: 'rgba(108, 117, 125, 0.6)', border: '#6c757d', label: 'Cement' },
            'Sežiganje': { bg: 'rgba(255, 99, 132, 0.6)', border: '#ff6b6b', label: 'Sežiganje' },
            'Drugo': { bg: 'rgba(0, 123, 255, 0.6)', border: '#007bff', label: 'Drugo' }
        };

        // Stacked Area Chart
        const stackedCtx = document.getElementById('stackedAreaChart')?.getContext('2d');
        if (stackedCtx) {
            const datasets = fuelTypes.map(fuel => ({
                label: fuel,
                data: sloYears.map(year => {
                    const record = sloGroupedByYear[year]?.find(d => d.fuel === fuel);
                    return record ? (record.perCapita || 0) : 0;
                }),
                backgroundColor: colorMap[fuel]?.bg || 'rgba(128, 128, 128, 0.6)',
                borderColor: colorMap[fuel]?.border || 'rgb(128, 128, 128)',
                borderWidth: 1,
                fill: true
            }));
            new Chart(stackedCtx, {
                type: 'line',
                data: {
                    labels: sloYears,
                    datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: {
                            callbacks: {
                                label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)} t CO₂/osebo`
                            }
                        }
                    },
                    scales: {
                        y: {
                            title: { display: true, text: 'Emisije CO₂ (t CO₂/osebo)' },
                            stacked: true,
                            beginAtZero: true
                        },
                        x: {
                            title: { display: true, text: 'Leto' }
                        }
                    }
                }
            });
        } else {
            console.error('Cannot find canvas for stacked chart');
        }

        // Donut Chart (2022)
        const donutCtx = document.getElementById('donutChart')?.getContext('2d');
        if (donutCtx) {
            const donutData = fuelTypes.map(fuel => {
                const record = latestYearData.find(d => d.fuel === fuel);
                return record ? (record.perCapita || 0) : 0;
            });
            new Chart(donutCtx, {
                type: 'doughnut',
                data: {
                    labels: fuelTypes,
                    datasets: [{
                        data: donutData,
                        backgroundColor: fuelTypes.map(f => colorMap[f]?.bg || 'rgba(128, 128, 128, 0.7)'),
                        borderColor: fuelTypes.map(f => colorMap[f]?.border || 'rgb(128, 128, 128)'),
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
                                label: ctx => {
                                    const total = donutData.reduce((sum, val) => sum + val, 0);
                                    const percentage = total > 0 ? (ctx.parsed / total * 100).toFixed(1) : 0;
                                    return `${ctx.label}: ${ctx.parsed.toFixed(2)} t CO₂/osebo (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        } else {
            console.error('Cannot find canvas for donut chart');
        }

        // Human Body Visualization
        const svgIds = ['sloveniaSvg', 'euSvg', 'worldSvg'];
        const regions = ['Slovenia', 'European Union (27)', 'World'];
        
        const bodyParts = [
            { id: 'head', fuel: 'Premog', label: 'Premog' },
            { id: 'torso', fuel: 'Nafta', label: 'Nafta' },
            { id: 'leftArm', fuel: 'Zemeljski plin', label: 'Zemeljski plin' },
            { id: 'rightArm', fuel: 'Cement', label: 'Cement' },
            { id: 'leftLeg', fuel: 'Sežiganje', label: 'Sežiganje' },
            { id: 'rightLeg', fuel: 'Drugo', label: 'Drugo' }
        ];

        // Create legend
        function createLegend() {
            const legendContainer = document.getElementById('humanBodyLegend');
            legendContainer.innerHTML = '';
            
            Object.entries(colorMap).forEach(([fuel, { bg, label }]) => {
                const legendItem = document.createElement('div');
                legendItem.className = 'd-flex align-items-center mx-3 mb-2';
                legendItem.innerHTML = `
                    <div style="width: 15px; height: 15px; background-color: ${bg}; border: 1px solid ${colorMap[fuel].border};" class="me-2"></div>
                    <span class="fs-7">${label}</span>
                `;
                legendContainer.appendChild(legendItem);
            });
        }

        // SVG template for human silhouette
        const humanSvgTemplate = (svgId) => `
            <g>
                <!-- Head -->
                <path id="${svgId}-head" class="body-part" d="M30,20 a20,20 0 1,0 40,0 a20,20 0 1,0 -40,0" />
                <!-- Torso -->
                <path id="${svgId}-torso" class="body-part" d="M30,40 h40 v80 h-40 z" />
                <!-- Left Arm (right side from viewer's perspective) -->
                <path id="${svgId}-leftArm" class="body-part" d="M30,40 h-15 v50 h15 z" />
                <!-- Right Arm -->
                <path id="${svgId}-rightArm" class="body-part" d="M70,40 h15 v50 h-15 z" />
                <!-- Left Leg -->
                <path id="${svgId}-leftLeg" class="body-part" d="M30,120 h15 v70 h-15 z" />
                <!-- Right Leg -->
                <path id="${svgId}-rightLeg" class="body-part" d="M55,120 h15 v70 h-15 z" />
            </g>
        `;

        // Initialize SVGs
        svgIds.forEach((svgId, index) => {
            const svg = document.getElementById(svgId);
            if (svg) {
                svg.innerHTML = humanSvgTemplate(svgId);
                svg.setAttribute('height', '200');
            }
        });

        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.id = 'bodyPartTooltip';
        tooltip.style.position = 'absolute';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '8px 12px';
        tooltip.style.borderRadius = '4px';
        tooltip.style.fontSize = '14px';
        tooltip.style.zIndex = '1000';
        tooltip.style.display = 'none';
        document.body.appendChild(tooltip);

        // Process comparison data
        const years = [...new Set(comparisonData.map(d => d.year))].sort((a, b) => a - b);
        const groupedByYear = years.reduce((acc, year) => {
            acc[year] = comparisonData.filter(d => d.year === year);
            return acc;
        }, {});

        const updateHumanBodyVisualization = (selectedYear) => {
            regions.forEach((region, regionIndex) => {
                const svg = document.getElementById(svgIds[regionIndex]);
                if (!svg) return;

                const yearData = groupedByYear[selectedYear] || [];
                const regionData = yearData.filter(d => d.region === region);

                // Calculate total per capita emissions
                const totalPerCapita = regionData.reduce((sum, d) => sum + (d.perCapita || 0), 0);

                bodyParts.forEach(part => {
                    const partElement = document.getElementById(`${svgIds[regionIndex]}-${part.id}`);
                    const fuelData = regionData.find(d => d.fuel === part.fuel);
                    const perCapita = fuelData ? (fuelData.perCapita || 0) : 0;
                    const percentage = totalPerCapita > 0 ? (perCapita / totalPerCapita * 100).toFixed(1) : 0;

                    if (partElement) {
                        partElement.style.fill = colorMap[part.fuel]?.bg || 'rgba(128, 128, 128, 0.6)';
                        partElement.style.stroke = colorMap[part.fuel]?.border || 'rgb(128, 128, 128)';
                        partElement.style.strokeWidth = '1px';
                        partElement.style.cursor = 'pointer';
                        partElement.style.transition = 'fill 0.2s ease';
                        
                        // Remove any existing event listeners to avoid duplicates
                        const newElement = partElement.cloneNode(true);
                        partElement.parentNode.replaceChild(newElement, partElement);

                        // Hover effects
                        newElement.addEventListener('mouseenter', (e) => {
                            newElement.style.opacity = '0.8';
                            newElement.style.filter = 'drop-shadow(0 0 4px rgba(0,0,0,0.5))';
                            
                            // Position tooltip
                            tooltip.innerHTML = `
                                <div class="fw-bold">${part.label}</div>
                                <div>${perCapita.toFixed(2)} t CO₂/osebo</div>
                                <div>${percentage}% vseh emisij</div>
                            `;
                            tooltip.style.display = 'block';
                            
                            // Position near cursor but not covering the body part
                            const x = e.clientX + 15;
                            const y = e.clientY - 15;
                            tooltip.style.left = `${x}px`;
                            tooltip.style.top = `${y}px`;
                            
                            // Adjust if tooltip goes off-screen
                            const tooltipRect = tooltip.getBoundingClientRect();
                            if (tooltipRect.right > window.innerWidth) {
                                tooltip.style.left = `${x - tooltipRect.width - 30}px`;
                            }
                            if (tooltipRect.bottom > window.innerHeight) {
                                tooltip.style.top = `${y - tooltipRect.height}px`;
                            }
                        });

                        newElement.addEventListener('mousemove', (e) => {
                            const x = e.clientX + 15;
                            const y = e.clientY - 15;
                            tooltip.style.left = `${x}px`;
                            tooltip.style.top = `${y}px`;
                        });

                        newElement.addEventListener('mouseleave', () => {
                            newElement.style.opacity = '1';
                            newElement.style.filter = 'none';
                            tooltip.style.display = 'none';
                        });

                        // Click event for more detailed popup
                       
newElement.addEventListener('click', (e) => {
    // Remove any existing popup first
    const existingPopup = document.getElementById('fuelPopup');
    if (existingPopup) existingPopup.remove();

    const popup = document.createElement('div');
    popup.id = 'fuelPopup';
    popup.className = 'position-fixed top-50 start-50 translate-middle z-index-1050';
    popup.style.zIndex = '1050';
    popup.style.width = '300px';
    popup.style.height = 'auto';
    
    // Get the colors for this fuel type
    const fuelColor = colorMap[part.fuel] || { bg: '#007bff', border: '#0056b3' };
    
    popup.innerHTML = `
        <div class="card shadow-lg">
            <div class="card-header text-white py-2" style="background-color: ${fuelColor.border}; border-color: ${fuelColor.border}">
                <h5 class="mb-0 fs-6">${part.label} - ${selectedYear}</h5>
            </div>
            <div class="card-body p-3">
                <p class="mb-1"><strong>Regija:</strong> ${region}</p>
                <p class="mb-1"><strong>Emisije:</strong> ${perCapita.toFixed(2)} t CO₂/osebo</p>
                <p class="mb-0"><strong>Delež:</strong> ${percentage}% vseh emisij</p>
            </div>
            <div class="card-footer text-end py-2">
                <button class="btn btn-sm text-white" style="background-color: ${fuelColor.border}; border-color: ${fuelColor.border}" onclick="document.getElementById('fuelPopup').remove()">Zapri</button>
            </div>
        </div>
    `;
    document.body.appendChild(popup);
    
    // Close when clicking outside
    const closeOnOutsideClick = (e) => {
        if (!popup.contains(e.target)) {
            popup.remove();
            document.removeEventListener('click', closeOnOutsideClick);
        }
    };
    setTimeout(() => {
        document.addEventListener('click', closeOnOutsideClick);
    }, 100);
});
                    }
                });
            });
        };

        // Create legend
        createLegend();

        // Populate year dropdown
        const humanYearSelect = document.getElementById('humanYearSelect');
        if (humanYearSelect) {
            years.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                humanYearSelect.appendChild(option);
            });
            humanYearSelect.value = '2022';
            updateHumanBodyVisualization(2022);
            humanYearSelect.addEventListener('change', () => {
                updateHumanBodyVisualization(parseInt(humanYearSelect.value));
            });
        }

        // Bar Chart with Year Dropdown (Per Capita)
        const barCtx = document.getElementById('fuelComparisonBarChart')?.getContext('2d');
        if (barCtx) {
            let barChart;
            const updateBarChart = (selectedYear) => {
                const yearData = sloGroupedByYear[selectedYear] || [];
                const barData = fuelTypes.map(fuel => {
                    const record = yearData.find(d => d.fuel === fuel);
                    return record ? (record.perCapita || 0) : 0;
                });

                if (barChart) {
                    barChart.data.datasets[0].data = barData;
                    barChart.options.plugins.title.text = `Emisije CO₂ na prebivalca po gorivih v letu ${selectedYear}`;
                    barChart.update();
                } else {
                    barChart = new Chart(barCtx, {
                        type: 'bar',
                        data: {
                            labels: fuelTypes,
                            datasets: [{
                                label: 'Emisije CO₂ (t CO₂/osebo)',
                                data: barData,
                                backgroundColor: fuelTypes.map(f => colorMap[f]?.bg || 'rgba(128, 128, 128, 0.7)'),
                                borderColor: fuelTypes.map(f => colorMap[f]?.border || 'rgb(128, 128, 128)'),
                                borderWidth: 1
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false },
                                title: {
                                    display: true,
                                    text: `Emisije CO₂ na prebivalca po gorivih v letu ${selectedYear}`,
                                    font: { size: 16 }
                                },
                                tooltip: {
                                    callbacks: {
                                        label: ctx => `${ctx.label}: ${ctx.parsed.y.toFixed(2)} t CO₂/osebo`
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    title: { display: true, text: 'Emisije CO₂ (t CO₂/osebo)' },
                                    beginAtZero: true
                                },
                                x: {
                                    title: { display: true, text: 'Gorivo' }
                                }
                            }
                        }
                    });
                }
            };

            const yearSelect = document.getElementById('yearSelect');
            if (yearSelect) {
                sloYears.forEach(year => {
                    const option = document.createElement('option');
                    option.value = year;
                    option.textContent = year;
                    yearSelect.appendChild(option);
                });
                yearSelect.value = '2022';
                updateBarChart(2022);
                yearSelect.addEventListener('change', () => {
                    updateBarChart(parseInt(yearSelect.value));
                });
            }
        } else {
            console.error('Cannot find canvas for bar chart');
        }

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

        // Download handler for stackedAreaChart
        window.downloadStackedAreaChartCSV = function() {
            if (!sloGroupedByYear || !sloYears || sloYears.length === 0) {
                alert('Ni podatkov za prenos. Prosimo, poskusite znova.');
                return;
            }

            const headers = ['Leto', ...fuelTypes.map(fuel => fuel.replace(/\s/g, '_'))];
            const data = sloYears.map(year => {
                const yearData = sloGroupedByYear[year] || [];
                const row = { year };
                fuelTypes.forEach(fuel => {
                    const record = yearData.find(d => d.fuel === fuel);
                    row[fuel] = record ? (record.perCapita || 0) : 0;
                });
                return row;
            });

            const rowFormatter = row => [
                row.year,
                ...fuelTypes.map(fuel => row[fuel].toFixed(2))
            ].join(',');

            downloadCSV(
                data,
                'slovenia_co2_per_capita_by_fuel_1991-2022.csv',
                headers,
                rowFormatter
            );
        };
    } catch (error) {
        loadingIndicator.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle fa-sm me-2"></i>
                Napaka: ${error.message}
            </div>
        `;
        console.error('Napaka pri inicializaciji grafikonov:', error);
    }
}

window.initializeFuelCharts = initializeFuelCharts;
initializeFuelCharts();