document.addEventListener('DOMContentLoaded', function () {
    const globeButton = document.getElementById('globeButton');
    const mapPopup = document.getElementById('mapPopup');
    const mapOverlay = document.getElementById('mapOverlay');
    const closeMapPopup = document.getElementById('closeMapPopup');
    const sidenav = document.getElementById('sidenav-main');
    const popupTitle = document.getElementById('popupTitle');
    const legendContainer = document.getElementById('legendContainer'); // Updated to target legendContainer
    const mapTab = document.getElementById('map-tab');
    const graphTab = document.getElementById('graph-tab');

    // Validate DOM elements
    if (!globeButton) {
        console.error('Globe button not found.');
        return;
    }
    if (!mapPopup || !mapOverlay || !closeMapPopup) {
        console.error('Map popup, overlay, or close button not found.');
        return;
    }
    if (!sidenav) {
        console.error('Sidenav not found.');
        return;
    }
    if (!popupTitle || !legendContainer) {
        console.error('Popup title or legend container not found.');
        return;
    }
    if (!mapTab || !graphTab) {
        console.error('Map or graph tab not found.');
        return;
    }

    // Open popup and initialize map
    globeButton.addEventListener('click', function () {
        mapPopup.style.display = 'block';
        mapOverlay.style.display = 'block';
        sidenav.style.display = 'none';
        popupTitle.textContent = 'Globalne emisije CO₂ na prebivalca (2022)';
        legendContainer.style.display = 'block'; // Show legend on open
        document.getElementById('globeContainer').innerHTML = ''; // Clear container
        initMap();
    });

    // Close popup and clear map
    closeMapPopup.addEventListener('click', function () {
        mapPopup.style.display = 'none';
        mapOverlay.style.display = 'none';
        sidenav.style.display = 'block';
        document.getElementById('globeContainer').innerHTML = '';
        legendContainer.style.display = 'none';
    });

    // Tab switching: Update title and legend
    mapTab.addEventListener('click', function () {
        popupTitle.textContent = 'Globalne emisije CO₂ na prebivalca (2022)';
        legendContainer.style.display = 'block';
        document.getElementById('globeContainer').innerHTML = ''; // Clear container
        initMap();
    });

    graphTab.addEventListener('click', function () {
        popupTitle.textContent = 'Globalne emisije CO₂ skozi čas';
        legendContainer.style.display = 'none';
        document.getElementById('globeContainer').innerHTML = ''; // Clear map when switching to graph
    });

    // Numeric to Alpha-3 ISO code mapping
    const numericToAlpha3 = {
        '004': 'AFG', '008': 'ALB', '012': 'DZA', '016': 'ASM', '020': 'AND',
        '024': 'AGO', '660': 'AIA', '028': 'ATG', '032': 'ARG', '051': 'ARM',
        '533': 'ABW', '036': 'AUS', '040': 'AUT', '031': 'AZE', '044': 'BHS',
        '048': 'BHR', '050': 'BGD', '052': 'BRB', '112': 'BLR', '056': 'BEL',
        '084': 'BLZ', '204': 'BEN', '060': 'BMU', '064': 'BTN', '068': 'BOL',
        '070': 'BIH', '072': 'BWA', '076': 'BRA', '092': 'VGB', '096': 'BRN',
        '100': 'BGR', '854': 'BFA', '108': 'BDI', '116': 'KHM', '120': 'CMR',
        '124': 'CAN', '132': 'CPV', '140': 'CAF', '148': 'TCD', '152': 'CHL',
        '156': 'CHN', '344': 'HKG', '446': 'MAC', '170': 'COL', '174': 'COM',
        '178': 'COG', '180': 'COD', '184': 'COK', '188': 'CRI', '191': 'HRV',
        '192': 'CUB', '196': 'CYP', '203': 'CZE', '208': 'DNK', '262': 'DJI',
        '212': 'DMA', '214': 'DOM', '218': 'ECU', '818': 'EGY', '222': 'SLV',
        '226': 'GNQ', '232': 'ERI', '233': 'EST', '231': 'ETH', '238': 'FLK',
        '234': 'FRO', '242': 'FJI', '246': 'FIN', '250': 'FRA', '254': 'GUF',
        '258': 'PYF', '260': 'ATF', '266': 'GAB', '270': 'GMB', '268': 'GEO',
        '276': 'DEU', '288': 'GHA', '292': 'GIB', '300': 'GRC', '304': 'GRL',
        '308': 'GRD', '312': 'GLP', '316': 'GUM', '320': 'GTM', '324': 'GIN',
        '624': 'GNB', '328': 'GUY', '332': 'HTI', '334': 'HMD', '340': 'HND',
        '348': 'HUN', '352': 'ISL', '356': 'IND', '360': 'IDN', '364': 'IRN',
        '368': 'IRQ', '372': 'IRL', '376': 'ISR', '380': 'ITA', '388': 'JAM',
        '392': 'JPN', '400': 'JOR', '398': 'KAZ', '404': 'KEN', '296': 'KIR',
        '414': 'KWT', '417': 'KGZ', '418': 'LAO', '428': 'LVA', '422': 'LBN',
        '426': 'LSO', '430': 'LBR', '434': 'LBY', '438': 'LIE', '440': 'LTU',
        '442': 'LUX', '807': 'MKD', '450': 'MDG', '454': 'MWI', '458': 'MYS',
        '462': 'MDV', '466': 'MLI', '470': 'MLT', '584': 'MHL', '474': 'MTQ',
        '478': 'MRT', '480': 'MUS', '175': 'MYT', '484': 'MEX', '583': 'FSM',
        '492': 'MCO', '496': 'MNG', '499': 'MNE', '500': 'MSR', '504': 'MAR',
        '508': 'MOZ', '104': 'MMR', '516': 'NAM', '520': 'NRU', '524': 'NPL',
        '528': 'NLD', '530': 'ANT', '540': 'NCL', '554': 'NZL', '558': 'NIC',
        '562': 'NER', '566': 'NGA', '570': 'NIU', '574': 'NFK', '580': 'MNP',
        '578': 'NOR', '512': 'OMN', '586': 'PAK', '585': 'PLW', '591': 'PAN',
        '598': 'PNG', '600': 'PRY', '604': 'PER', '608': 'PHL', '612': 'PCN',
        '616': 'POL', '620': 'PRT', '630': 'PRI', '634': 'QAT', '638': 'REU',
        '642': 'ROU', '643': 'RUS', '646': 'RWA', '654': 'SHN', '659': 'KNA',
        '662': 'LCA', '666': 'SPM', '670': 'VCT', '882': 'WSM', '674': 'SMR',
        '678': 'STP', '682': 'SAU', '686': 'SEN', '690': 'SYC', '694': 'SLE',
        '702': 'SGP', '703': 'SVK', '705': 'SVN', '090': 'SLB', '706': 'SOM',
        '710': 'ZAF', '239': 'SGS', '728': 'SSD', '724': 'ESP', '144': 'LKA',
        '729': 'SDN', '740': 'SUR', '744': 'SJM', '748': 'SWZ', '752': 'SWE',
        '756': 'CHE', '760': 'SYR', '158': 'TWN', '762': 'TJK', '764': 'THA',
        '626': 'TLS', '768': 'TGO', '772': 'TKL', '776': 'TON', '780': 'TTO',
        '788': 'TUN', '792': 'TUR', '795': 'TKM', '796': 'TCA', '798': 'TUV',
        '800': 'UGA', '804': 'UKR', '826': 'GBR', '831': 'GGY', '832': 'JEY',
        '833': 'IMN', '834': 'TZA', '840': 'USA', '858': 'URY', '860': 'UZB',
        '548': 'VUT', '862': 'VEN', '876': 'WLF', '887': 'YEM', '894': 'ZMB',
        '716': 'ZWE'
    };

    let countryData = {};

    async function initMap() {
        const container = document.getElementById('globeContainer');
        if (!container) {
            console.error('Map container not found.');
            return;
        }
        container.innerHTML = ''; // Always clear container

        try {
            const response = await fetch('/api/globe-data');
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();

            countryData = {};
            data.forEach(item => {
                if (item.iso_code) {
                    countryData[item.iso_code.toUpperCase()] = {
                        name: item.country,
                        value: item.co2_per_capita,
                        total_co2: item.co2,
                        population: item.population
                    };
                }
            });

            if (Object.keys(countryData).length === 0) {
                console.warn('No data found for the map visualization.');
                container.innerHTML = '<p style="color: #fff;">No CO₂ data available.</p>';
                return;
            }

            createMapVisualization();
        } catch (error) {
            console.error('Error loading CO₂ data:', error);
            container.innerHTML = '<p style="color: #fff;">Error loading CO₂ data. Please try again.</p>';
        }
    }

    function createMapVisualization() {
        const container = document.getElementById('globeContainer');
        if (!container) {
            console.error('Map container not found.');
            return;
        }

        const width = container.clientWidth;
        const height = container.clientHeight;
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        const g = svg.append('g');

        const tooltip = d3.select(container)
            .append('div')
            .attr('id', 'countryTooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(0, 0, 0, 0.8)')
            .style('color', '#fff')
            .style('padding', '8px')
            .style('border-radius', '4px')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .style('display', 'none')
            .style('z-index', '10');

        const projection = d3.geoMercator()
            .scale(width / 2.5 / Math.PI)
            .translate([width / 2, height / 1.5]);
        const path = d3.geoPath().projection(projection);

        const maxCo2 = Math.max(...Object.values(countryData).map(d => d.value || 0), 1);
        const colorScale = d3.scaleSequential(d3.interpolateViridis).domain([0, maxCo2]);

        const zoom = d3.zoom()
            .scaleExtent([1, 8])
            .translateExtent([[0, 0], [width, height]])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        svg.call(zoom);

        fetch('https://unpkg.com/world-atlas@2.0.2/countries-110m.json')
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
                return res.json();
            })
            .then(topo => {
                const countries = topojson.feature(topo, topo.objects.countries).features;

                g.selectAll('path')
                    .data(countries)
                    .enter()
                    .append('path')
                    .attr('d', d => {
                        const pathData = path(d);
                        if (!pathData) {
                            console.warn('Invalid geometry for:', d.properties.name);
                            return null;
                        }
                        return pathData;
                    })
                    .attr('fill', d => {
                        const numericCode = d.id;
                        if (!numericCode) {
                            console.warn('Missing numeric code for:', d.properties.name);
                            return '#cccccc';
                        }
                        const alpha3Code = numericToAlpha3[numericCode];
                        if (!alpha3Code) {
                            console.warn('No alpha3 code for numeric code:', numericCode, 'Country:', d.properties.name);
                            return '#cccccc';
                        }
                        if (!countryData[alpha3Code]) {
                            console.warn('No CO2 data for alpha3 code:', alpha3Code, 'Country:', d.properties.name);
                            return '#cccccc';
                        }
                        return colorScale(countryData[alpha3Code].value || 0);
                    })
                    .attr('stroke', '#000000')
                    .attr('stroke-width', 0.5)
                    .on('mouseover', function (event, d) {
                        const numericCode = d.id;
                        if (!numericCode) return;
                        const alpha3Code = numericToAlpha3[numericCode];
                        if (!alpha3Code || !countryData[alpha3Code]) return;

                        d3.select(this).attr('fill', '#ff0000');
                        updateCountryInfo(countryData[alpha3Code], event, tooltip, projection, path, d);
                    })
                    .on('mouseout', function (event, d) {
                        const numericCode = d.id;
                        if (!numericCode) return;
                        const alpha3Code = numericToAlpha3[numericCode];
                        if (!alpha3Code || !countryData[alpha3Code]) {
                            d3.select(this).attr('fill', '#cccccc');
                            return;
                        }
                        d3.select(this).attr('fill', colorScale(countryData[alpha3Code].value || 0));
                        tooltip.style('display', 'none');
                    })
                    .filter(d => !path(d))
                    .remove();

                createLegend(colorScale, maxCo2);
            })
            .catch(error => {
                console.error('Error loading world map:', error);
                document.getElementById('globeContainer').innerHTML = '<p style="color: #fff;">Error loading map data. Please try again.</p>';
            });

        window.addEventListener('resize', () => {
            const newWidth = container.clientWidth;
            const newHeight = container.clientHeight;
            svg.attr('width', newWidth).attr('height', newHeight);
            projection.scale(newWidth / 2.5 / Math.PI).translate([newWidth / 2, newHeight / 1.5]);
            g.selectAll('path').attr('d', d => {
                const pathData = path(d);
                if (!pathData) return null;
                return pathData;
            }).filter(d => !path(d)).remove();

            svg.call(zoom.transform, d3.zoomIdentity);
        });
    }

    function createLegend(colorScale, maxValue) {
        const legendContainer = document.getElementById('legend');
        if (!legendContainer) {
            console.error('Legend container not found.');
            return;
        }
        legendContainer.innerHTML = '';

        const title = document.createElement('div');
        title.textContent = 'CO₂ emisije na prebivalca (tone)';
        title.style.color = '#fff';
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '10px';
        legendContainer.appendChild(title);

        const svg = d3.select(legendContainer)
            .append('svg')
            .attr('width', 200)
            .attr('height', 30);

        const steps = 5;
        const values = d3.range(0, maxValue + (maxValue / steps), maxValue / steps);

        svg.selectAll('circle')
            .data(values)
            .enter()
            .append('circle')
            .attr('cx', (d, i) => i * 40 + 15)
            .attr('cy', 15)
            .attr('r', 10)
            .attr('fill', d => colorScale(d));

        svg.selectAll('text')
            .data(values)
            .enter()
            .append('text')
            .attr('x', (d, i) => i * 40 + 15)
            .attr('y', 28)
            .attr('text-anchor', 'middle')
            .attr('fill', '#fff')
            .attr('font-size', '10px')
            .text(d => d.toFixed(1));
    }

    function updateCountryInfo(data, event, tooltip, projection, path, country) {
        if (!data || !data.value) {
            tooltip.style('display', 'none');
            return;
        }

        const content = `
            <h5 style="margin: 0 0 5px; font-size: 14px; color: #fff;">${data.name}</h5>
            <table style="font-size: 12px; color: #fff;">
                <tr>
                    <td>CO₂ na prebivalca:</td>
                    <td style="padding-left: 8px;">${data.value ? data.value.toFixed(2) : 'N/A'} ton</td>
                </tr>
                <tr>
                    <td>Skupni CO₂:</td>
                    <td style="padding-left: 8px;">${data.total_co2 ? data.total_co2.toFixed(2) : 'N/A'} milijonov ton</td>
                </tr>
                <tr>
                    <td>Prebivalstvo:</td>
                    <td style="padding-left: 8px;">${data.population ? data.population.toLocaleString('sl-SI') : 'N/A'}</td>
                </tr>
            </table>
        `;
        tooltip.html(content);

        const centroid = path.centroid(country);
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
    }
});