async function initializeSloveniaMap() {
    console.log('Inicializacija zemljevida Slovenije...', new Date().toISOString());
    const loadingIndicator = document.getElementById('sloveniaContainer');
    const legendContainer = document.getElementById('legendContainer');
    const legend = document.getElementById('legend');
 
    // Validate DOM elements
    if (!loadingIndicator || !legendContainer || !legend) {
        console.error('Manjkajo elementi zemljevida:', {
            sloveniaContainer: !!loadingIndicator,
            legendContainer: !!legendContainer,
            legend: !!legend
        });
        if (loadingIndicator) {
            loadingIndicator.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle fa-sm me-2"></i>
                    Napaka: Elementi zemljevida niso najdeni.
                </div>`;
        }
        return;
    }
 
    loadingIndicator.innerHTML = '<p style="color: #fff;">Nalaganje...</p>';
 
    // CO2 data for Slovenia's statistical regions (2022 estimates)
    const sloveniaCo2Data = [
        { region_code: 'SI031', region: 'Osrednjeslovenska', co2_per_capita: 6.8, co2: 3.88, population: 570000 },
        { region_code: 'SI041', region: 'Podravska', co2_per_capita: 6.8, co2: 2.17, population: 320000 },
        { region_code: 'SI042', region: 'Savinjska', co2_per_capita: 6.6, co2: 1.71, population: 260000 },
        { region_code: 'SI021', region: 'Primorsko-notranjska', co2_per_capita: 6.5, co2: 0.78, population: 120000 },
        { region_code: 'SI032', region: 'Zasavska', co2_per_capita: 6.4, co2: 0.32, population: 50000 },
        { region_code: 'SI033', region: 'Posavska', co2_per_capita: 6.4, co2: 0.45, population: 70000 },
        { region_code: 'SI034', region: 'Jugovzhodna Slovenija', co2_per_capita: 6.5, co2: 0.78, population: 120000 },
        { region_code: 'SI022', region: 'Notranjsko-kraška', co2_per_capita: 6.3, co2: 0.33, population: 53000 },
        { region_code: 'SI043', region: 'Koroška', co2_per_capita: 6.3, co2: 0.44, population: 70000 },
        { region_code: 'SI044', region: 'Gorenjska', co2_per_capita: 6.6, co2: 1.06, population: 160000 },
        { region_code: 'SI011', region: 'Pomurska', co2_per_capita: 6.4, co2: 0.76, population: 119000 },
        { region_code: 'SI012', region: 'Goriška', co2_per_capita: 6.5, co2: 0.78, population: 120000 }
    ];
 
    // Mock historical CO2 data (2000–2022)
    const historicalCo2 = {};
    sloveniaCo2Data.forEach(item => {
        historicalCo2[item.region_code] = [
            { year: 2000, co2: item.co2 * 0.80 },
            { year: 2005, co2: item.co2 * 0.85 },
            { year: 2010, co2: item.co2 * 0.90 },
            { year: 2015, co2: item.co2 * 0.95 },
            { year: 2020, co2: item.co2 * 1.00 },
            { year: 2022, co2: item.co2 }
        ];
    });
 
    let regionCo2 = {};
    let chartInstances = {};
 
    try {
        // Fetch GeoJSON data
        console.log('Pridobivanje GeoJSON podatkov iz API-ja...');
        const response = await fetch('/api/slovenia-geojson');
        if (!response.ok) throw new Error(`Napaka pri pridobivanju GeoJSON: ${response.status} ${response.statusText}`);
        const regions = await response.json();
        console.log('GeoJSON naložen:', regions);
 
        // Prepare CO2 data
        regionCo2 = sloveniaCo2Data.reduce((acc, item) => {
            acc[item.region_code] = {
                name: item.region,
                value: item.co2_per_capita,
                total_co2: item.co2,
                population: item.population
            };
            return acc;
        }, {});
 
        // Hide loading indicator and show content
        loadingIndicator.style.display = 'block';
        legendContainer.style.display = 'block';
 
        // Render map and legend
        renderMap(regions, loadingIndicator, legend, regionCo2, historicalCo2, chartInstances);
        renderLegend(legend, regionCo2);
    } catch (error) {
        console.error('Napaka pri inicializaciji zemljevida:', error);
        loadingIndicator.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle fa-sm me-2"></i>
                Napaka pri nalaganju podatkov zemljevida: ${error.message}
            </div>`;
    }
}
 
function renderMap(regions, container, legend, regionCo2, historicalCo2, chartInstances) {
    console.log('Risanje zemljevida Slovenije...');
    container.innerHTML = '';
 
    const width = Math.max(container.clientWidth, 800);
    const height = container.clientHeight * 0.9;
 
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);
 
    svg.append('defs')
        .append('clipPath')
        .attr('id', 'slovenia-clip')
        .append('rect')
        .attr('width', width)
        .attr('height', height);
 
    const g = svg.append('g')
        .attr('clip-path', 'url(#slovenia-clip)');
 
    const tooltip = d3.select('body')
        .append('div')
        .attr('id', 'sloveniaTooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(255, 255, 255, 0.95)')
        .style('color', '#2d3748')
        .style('padding', '8px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('display', 'none')
        .style('z-index', '1000')
        .style('box-shadow', '0 2px 8px rgba(0,0,0,0.1)')
        .style('max-width', '250px');
 
    const projection = d3.geoMercator()
        .scale(width * 15)
        .translate([width / 2, height / 2])
        .center([14.9955, 46.1512]);
 
    const path = d3.geoPath().projection(projection);
 
    const maxCo2 = Math.max(...Object.values(regionCo2).map(d => d.value || 0), 1);
    const colorScale = d3.scaleLinear()
        .domain([0, maxCo2 * 0.5, maxCo2])
        .range(["#d4f0ff", "#2c7fb8", "#081d58"]);
 
    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .translateExtent([[0, 0], [width, height]])
        .on('zoom', (event) => g.attr('transform', event.transform));
 
    svg.call(zoom);
 
    const codeMapping = {
        'Osrednjeslovenska': 'SI031',
        'Podravska': 'SI041',
        'Savinjska': 'SI042',
        'Obalno-kraška': 'SI021',
        'Zasavska': 'SI032',
        'Spodnjeposavska': 'SI033',
        'Jugovzhodna Slovenija': 'SI034',
        'Notranjsko-kraška': 'SI022',
        'Koroška': 'SI043',
        'Gorenjska': 'SI044',
        'Pomurska': 'SI011',
        'Goriška': 'SI012'
    };
 
    let activeFactory = null;
 
    g.selectAll('path')
        .data(regions.features)
        .enter()
        .append('path')
        .attr('d', d => path(d) || null)
        .attr('fill', d => {
            const code = codeMapping[d.properties.region];
            return code && regionCo2[code] ? colorScale(regionCo2[code].value || 0) : '#cccccc';
        })
        .attr('stroke', '#000')
        .attr('stroke-width', 0.5)
        .on('mouseover', function(event, d) {
            if (activeFactory) return;
            const code = codeMapping[d.properties.region];
            if (!code || !regionCo2[code]) return;
            d3.select(this).attr('fill', '#ff0000');
            showTooltip(regionCo2[code], historicalCo2[code], event, tooltip, projection, path, d, chartInstances);
        })
        .on('mousemove', function(event) {
            if (activeFactory) return;
            tooltip.style('left', `${event.pageX + 10}px`)
                   .style('top', `${event.pageY + 10}px`);
        })
        .on('mouseout', function(event, d) {
            if (activeFactory) return;
            const code = codeMapping[d.properties.region];
            if (!code || !regionCo2[code]) return;
            d3.select(this).attr('fill', colorScale(regionCo2[code].value || 0));
            tooltip.style('display', 'none');
            if (chartInstances[code]) {
                chartInstances[code].destroy();
                delete chartInstances[code];
            }
        });
 
    const biggestFactories = [
        { name: "TEŠ (Termoelektrarna Šoštanj)", coords: [15.1167, 46.3650], emoji: "🏭" },
        { name: "Nuklearna elektrarna Krško", coords: [15.5050, 45.9490], emoji: "⚛️" },
        { name: "Cementarna Salonit Anhovo", coords: [13.6819, 46.1531], emoji: "🏗️" },
        { name: "Cementarna Lafarge Trbovlje", coords: [15.0478, 46.1535], emoji: "🏗️" },
        { name: "Jeklarna Pivka", coords: [14.1300, 45.7383], emoji: "🏭" },
        { name: "Si.mobil (Telekom Slovenija - HQ)", coords: [14.5054, 46.0569], emoji: "🏢" },
        { name: "Jeklarna Impol", coords: [15.4833, 46.5675], emoji: "🏭" }
    ];
 
    const factoryGroup = g.append('g').attr('class', 'factory-markers');
    factoryGroup.selectAll('text')
        .data(biggestFactories)
        .enter()
        .append('text')
        .attr('x', d => projection(d.coords)[0])
        .attr('y', d => projection(d.coords)[1])
        .text(d => d.emoji)
        .attr('font-size', '24px')
        .attr('cursor', 'pointer')
        .attr('pointer-events', 'all')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'middle')
        .on('click', (event, d) => {
            event.stopPropagation();
            if (activeFactory === d.name) {
                tooltip.style('display', 'none');
                activeFactory = null;
            } else {
                activeFactory = d.name;
                tooltip.style('display', 'block')
                    .html(`<strong>${d.name}</strong>`)
                    .style('left', `${event.pageX + 10}px`)
                    .style('top', `${event.pageY + 10}px`);
            }
        });
 
    d3.select('body').on('click', () => {
        if (activeFactory) {
            tooltip.style('display', 'none');
            activeFactory = null;
        }
    });
 
    // Handle window resize
    window.addEventListener('resize', () => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight * 0.9;
        svg.attr('width', newWidth).attr('height', newHeight);
        svg.select('#slovenia-clip rect')
            .attr('width', newWidth)
            .attr('height', newHeight);
        projection.scale(newWidth * 15)
            .translate([newWidth / 2, newHeight / 2]);
        g.selectAll('path').attr('d', path);
        factoryGroup.selectAll('text')
            .attr('x', d => projection(d.coords)[0])
            .attr('y', d => projection(d.coords)[1]);
        svg.call(zoom.transform, d3.zoomIdentity);
    });
}
 
function renderLegend(legend, regionCo2) {
    console.log('Risanje legende...');
    legend.innerHTML = '';
 
    const title = document.createElement('div');
    title.textContent = 'CO₂ emisije na prebivalca (tone)';
    title.style.color = '#fff';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '10px';
    legend.appendChild(title);
 
    const containerWidth = legend.clientWidth || 200;
    const svg = d3.select(legend)
        .append('svg')
        .attr('width', containerWidth)
        .attr('height', 50);
 
    const maxCo2 = Math.max(...Object.values(regionCo2).map(d => d.value || 0), 1);
    const steps = 5;
    const values = d3.range(0, maxCo2 + (maxCo2 / steps), maxCo2 / steps);
    const spacing = containerWidth / values.length;
 
    const colorScale = d3.scaleLinear()
        .domain([0, maxCo2 * 0.5, maxCo2])
        .range(["#d4f0ff", "#2c7fb8", "#081d58"]);
 
    svg.selectAll('circle')
        .data(values)
        .enter()
        .append('circle')
        .attr('cx', (d, i) => spacing * i + spacing / 2)
        .attr('cy', 20)
        .attr('r', 10)
        .attr('fill', d => colorScale(d));
 
    svg.selectAll('text')
        .data(values)
        .enter()
        .append('text')
        .attr('x', (d, i) => spacing * i + spacing / 2)
        .attr('y', 42)
        .attr('text-anchor', 'middle')
        .attr('fill', '#fff')
        .attr('font-size', '12px')
        .text(d => d.toFixed(1));
}
 
function showTooltip(data, historical, event, tooltip, projection, path, region, chartInstances) {
    if (!data || !historical) {
        tooltip.style('display', 'none');
        return;
    }
 
    const chartId = `slovenia-co2-chart-${data.name.replace(/\s/g, '-')}`;
    const years = historical.map(d => d.year);
    const co2Values = historical.map(d => d.co2);
 
    const content = `
        <div class="card shadow-lg">
            <div class="card-header bg-primary text-white py-2">
                <h5 class="mb-0 fs-6">${data.name}</h5>
            </div>
            <div class="card-body p-3">
                <p class="mb-1"><strong>CO₂ na prebivalca:</strong> ${data.value.toFixed(2)} ton</p>
                <p class="mb-1"><strong>Skupaj CO₂:</strong> ${data.total_co2.toFixed(2)} Mt</p>
                <p class="mb-0"><strong>Prebivalstvo:</strong> ${data.population.toLocaleString()}</p>
                <div style="margin-top: 8px;">
                    <canvas id="${chartId}" style="width: 200px; height: 100px;"></canvas>
                </div>
            </div>
        </div>
    `;
    tooltip.html(content);
 
    const centroid = path.centroid(region);
    if (!centroid || isNaN(centroid[0]) || isNaN(centroid[1])) {
        tooltip.style('display', 'none');
        return;
    }
 
    const [x, y] = centroid;
    const tooltipWidth = tooltip.node().offsetWidth;
    const tooltipHeight = tooltip.node().offsetHeight;
 
    tooltip
        .style('left', `${x - tooltipWidth / 2}px`)
        .style('top', `${y - tooltipHeight - 10}px`)
        .style('display', 'block');
 
    setTimeout(() => {
        const ctx = document.getElementById(chartId)?.getContext('2d');
        if (ctx) {
            if (chartInstances[data.name]) {
                chartInstances[data.name].destroy();
            }
            chartInstances[data.name] = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: years,
                    datasets: [{
                        label: 'Skupaj CO₂ (Mt)',
                        data: co2Values,
                        borderColor: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.1)',
                        fill: true,
                        tension: 0.1,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false },
                        datalabels: { display: false }
                    },
                    scales: {
                        x: {
                            ticks: {
                                maxTicksLimit: 5,
                                color: '#2d3748',
                                font: { size: 10 }
                            },
                            grid: { display: false }
                        },
                        y: {
                            ticks: {
                                maxTicksLimit: 4,
                                color: '#2d3748',
                                font: { size: 10 },
                                callback: value => value.toFixed(2)
                            },
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        }
                    }
                }
            });
        } else {
            console.error('Ni najdenega platna za grafikon:', chartId);
        }
    }, 0);
}
 
// Initialize map when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSloveniaMap);
} else {
    initializeSloveniaMap();
}
 
window.initializeSloveniaMap = initializeSloveniaMap;