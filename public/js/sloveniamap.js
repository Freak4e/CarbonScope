console.log('sloveniamap.js loaded at', new Date().toISOString());

let isMapInitialized = false;

function initializeSloveniaMap() {
    if (isMapInitialized) {
        console.log('Slovenia map already initialized.');
        return;
    }
    isMapInitialized = true;

    console.log('Initializing Slovenia map...');

    // DOM elements
    const sloveniaContainer = document.getElementById('sloveniaContainer');
    const legendContainer = document.getElementById('legendContainer');
    const legend = document.getElementById('legend');

    
    console.log('Legend element:', legend);
    console.log('Legend size:', legend.clientWidth, legend.clientHeight);


    const svg = legend.querySelector('svg');
    console.log('SVG inside legend:', svg);
    console.log('SVG children count:', svg ? svg.children.length : 0);

    if(svg) {
    console.log('Circles:', svg.querySelectorAll('circle').length);
    console.log('Texts:', svg.querySelectorAll('text').length);
}



    // Validate DOM elements
    if (!sloveniaContainer || !legendContainer || !legend) {
        console.error('Slovenia map elements missing:', {
            sloveniaContainer: !!sloveniaContainer,
            legendContainer: !!legendContainer,
            legend: !!legend
        });
        if (sloveniaContainer) {
            sloveniaContainer.innerHTML = '<p style="color: #fff;">Error: Map elements not found.</p>';
        }
        return;
    }

    console.log('DOM elements found, proceeding...');

    // Set container styles
    sloveniaContainer.style.overflow = 'hidden';

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

async function initMap() {
    console.log('Fetching Slovenia GeoJSON from API endpoint...');
    sloveniaContainer.innerHTML = '<p style="color: #fff;">Loading...</p>';

    try {
        // Fetch from API endpoint instead of direct file
        const response = await fetch('/api/slovenia-geojson');
        if (!response.ok) throw new Error(`GeoJSON fetch failed: ${response.status} ${response.statusText}`);
        const regions = await response.json();
        console.log('GeoJSON loaded from API:', regions);

        // Log the first few features' properties for debugging
        if (regions.features && regions.features.length > 0) {
            console.log('Sample GeoJSON properties:', regions.features.slice(0, 3).map(f => f.properties));
        } else {
            console.warn('GeoJSON has no features.');
        }

        // Prepare CO2 data (unchanged)
        regionCo2 = {};
        sloveniaCo2Data.forEach(item => {
            regionCo2[item.region_code] = {
                name: item.region,
                value: item.co2_per_capita,
                total_co2: item.co2,
                population: item.population
            };
        });

        renderMap(regions);
    } catch (error) {
        console.error('Map init error:', error);
        sloveniaContainer.innerHTML = `
            <p style="color: #fff;">
                Error loading map data from API. Please try again later.
                <br>Technical details: ${error.message}
            </p>`;
    }
}
function renderMap(regions) {
    console.log('Rendering Slovenia map...');
    sloveniaContainer.innerHTML = '';
    legendContainer.style.display = 'block';

    const width = Math.max(sloveniaContainer.clientWidth, 800);
    const height = sloveniaContainer.clientHeight * 0.9;
    console.log('Map dimensions:', { width, height });

    const svg = d3.select(sloveniaContainer)
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
        .style('z-index', '10')
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
    .range(["#d4f0ff", "#2c7fb8", "#081d58"]);  // Light blue → medium → dark blue

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

    // Track factory tooltip separately
    let activeFactory = null;

    const paths = g.selectAll('path')
        .data(regions.features)
        .enter()
        .append('path')
        .attr('d', d => path(d) || null)
        .attr('fill', d => {
            let code = codeMapping[d.properties.region];
            if (!code || !regionCo2[code]) return '#cccccc';
            return colorScale(regionCo2[code].value || 0);
        })
        .attr('stroke', '#000')
        .attr('stroke-width', 0.5)
        .on('mouseover', function(event, d) {
            if (activeFactory) return;  // Skip hover if factory tooltip active
            let code = codeMapping[d.properties.region];
            if (!code || !regionCo2[code]) return;
            d3.select(this).attr('fill', '#ff0000');
            showTooltip(regionCo2[code], historicalCo2[code], event, tooltip, projection, path, d);
        })
        .on('mousemove', function(event, d) {
            if (activeFactory) return;
            tooltip.style('left', `${event.pageX + 10}px`)
                   .style('top', `${event.pageY + 10}px`);
        })
        .on('mouseout', function(event, d) {
            if (activeFactory) return;
            let code = codeMapping[d.properties.region];
            if (!code || !regionCo2[code]) return;
            d3.select(this).attr('fill', colorScale(regionCo2[code].value || 0));
            tooltip.style('display', 'none');
            if (chartInstances[code]) {
                chartInstances[code].destroy();
                delete chartInstances[code];
            }
        });

    // Factory markers
    const biggestFactories = [
        { name: "TEŠ (Thermal Power Plant Šoštanj)", coords: [15.1167, 46.3650], emoji: "🏭" },
        { name: "Krško Nuclear Power Plant", coords: [15.5050, 45.9490], emoji: "⚛️" },
        { name: "Salonit Anhovo Cement Plant", coords: [13.6819, 46.1531], emoji: "🏗️" },
        { name: "Lafarge Cement Plant Trbovlje", coords: [15.0478, 46.1535], emoji: "🏗️" },
        { name: "Pivka Steelworks", coords: [14.1300, 45.7383], emoji: "🏭" },
        { name: "Si.mobil (Telekom Slovenia - HQ)", coords: [14.5054, 46.0569], emoji: "🏢" },
        { name: "Impol Steelworks", coords: [15.4833, 46.5675], emoji: "🏭" }
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

    // Clicking elsewhere hides factory tooltip
    d3.select('body').on('click', () => {
        if (activeFactory) {
            tooltip.style('display', 'none');
            activeFactory = null;
        }
    });

    renderLegend(colorScale, maxCo2);

    window.addEventListener('resize', () => {
        const newWidth = sloveniaContainer.clientWidth;
        const newHeight = sloveniaContainer.clientHeight * 0.9;
        svg.attr('width', newWidth).attr('height', newHeight);
        svg.select('#slovenia-clip rect')
            .attr('width', newWidth)
            .attr('height', newHeight);
        projection.scale(newWidth * 15)
            .translate([newWidth / 2, newHeight / 2]);
        g.selectAll('path').attr('d', path);
        svg.call(zoom.transform, d3.zoomIdentity);
    });
}

function renderLegend(colorScale, maxValue) {
    console.log('Rendering legend...');
    legend.innerHTML = '';

    // Create and append the legend title
    const title = document.createElement('div');
    title.textContent = 'CO₂ emisije na prebivalca (tone)';
    title.style.color = '#fff';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '10px';
    legend.appendChild(title);

    // Measure the legend container width after adding the title
    const containerWidth = legend.clientWidth || 200;
    console.log('Legend container width:', containerWidth);

    // Append the SVG with explicit width and height
    const svg = d3.select(legend)
        .append('svg')
        .attr('width', containerWidth)
        .attr('height', 50);

    // Create the legend steps and values
    const steps = 5;
    const values = d3.range(0, maxValue + (maxValue / steps), maxValue / steps);
    const spacing = containerWidth / values.length;
    console.log('Values:', values);
    console.log('Spacing:', spacing);

    // Append circles for each legend value
    svg.selectAll('circle')
        .data(values)
        .enter()
        .append('circle')
        .attr('cx', (d, i) => spacing * i + spacing / 2)
        .attr('cy', 20)
        .attr('r', 10)
        .attr('fill', d => colorScale(d));

    // Append text labels below each circle
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


    function showTooltip(data, historical, event, tooltip, projection, path, region) {
    if (!data || !historical) {
        tooltip.style('display', 'none');
        return;
    }

    const chartId = `slovenia-co2-chart-${data.name.replace(/\s/g, '-')}`;
    const years = historical.map(d => d.year);
    const co2Values = historical.map(d => d.co2);

    const content = `
        <h5 style="margin: 0 0 5px; font-size: 14px; color: #2d3748; font-weight: 700;">${data.name}</h5>
        <table style="font-size: 12px; color: #2d3748; margin-bottom: 8px;">
            <tr><td>CO₂ na prebivalca:</td><td style="padding-left: 8px;">${data.value.toFixed(2)} ton</td></tr>
            <tr><td>Skupaj CO₂:</td><td style="padding-left: 8px;">${data.total_co2.toFixed(2)} Mt</td></tr>
            <tr><td>Prebivalstvo:</td><td style="padding-left: 8px;">${data.population.toLocaleString()}</td></tr>
        </table>
        <div style="margin-top: 8px;">
            <canvas id="${chartId}" style="width: 200px; height: 100px;"></canvas>
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
            console.error('No canvas for chart ID:', chartId);
        }
    }, 0);
}

    // Call initMap directly
    try {
        console.log('Calling initMap directly...');
        initMap();
    } catch (error) {
        console.error('Error in initMap:', error);
    }
}

// Wait for DOM elements to be available
function waitForMapElements() {
    const sloveniaContainer = document.getElementById('sloveniaContainer');
    if (sloveniaContainer) {
        console.log('sloveniaContainer found, initializing map...');
        initializeSloveniaMap();
    } else {
        console.log('sloveniaContainer not found, setting up observer...');
        const observer = new MutationObserver((mutations, obs) => {
            const container = document.getElementById('sloveniaContainer');
            if (container) {
                console.log('sloveniaContainer appeared in DOM, initializing map...');
                obs.disconnect();
                initializeSloveniaMap();
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

// Optional: Clear previous map (e.g., when switching tabs)
function destroySloveniaMap() {
    const sloveniaContainer = document.getElementById('sloveniaContainer');
    if (sloveniaContainer) {
        sloveniaContainer.innerHTML = '';
    }
    const legendContainer = document.getElementById('legendContainer');
    if (legendContainer) {
        legendContainer.style.display = 'none';
    }
    for (const key in chartInstances) {
        if (chartInstances[key]) {
            chartInstances[key].destroy();
            delete chartInstances[key];
        }
    }
    isMapInitialized = false;
    console.log('Slovenia map destroyed.');
}

// Optional: debounce helper for resize throttling
function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// Export for external use if needed
window.SloveniaMap = {
    init: waitForMapElements,
    destroy: destroySloveniaMap
};

// Auto-run if script loaded after DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForMapElements);
} else {
    waitForMapElements();
}

