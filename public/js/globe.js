document.addEventListener('DOMContentLoaded', function () {
  // Expose initMap globally for load-tabs-world.js to call
  window.initMap = function () {
    const globeContainer = document.getElementById('globeContainer');
    const legendContainer = document.getElementById('legendContainer');
    const legend = document.getElementById('legend');

    // Validate DOM elements
    if (!globeContainer || !legendContainer || !legend) {
      console.error('Map elements not found.');
      if (globeContainer) {
        globeContainer.innerHTML = '<p style="color: #fff;">Error: Missing page elements.</p>';
      }
      return;
    }

    // Set overflow hidden on globeContainer to prevent zoom overflow
    globeContainer.style.overflow = 'hidden';

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
      '716': 'ZWE', '732': 'ESH', '384': 'CIV', '275': 'PSE', '784': 'ARE',
      '704': 'VNM', '408': 'PRK', '410': 'KOR', '498': 'MDA', '010': 'ATA',
      '688': 'SRB', '999': 'CYP', '998': 'SOM', '997': 'XKX'
    };

    // Static fallback CO₂ data (2022)
    const fallbackData = [
      { iso_code: 'CHN', country: 'China', co2_per_capita: 7.1, co2: 10065, population: 1412600000 },
      { iso_code: 'USA', country: 'United States', co2_per_capita: 16.3, co2: 5416, population: 329500000 },
      { iso_code: 'IND', country: 'India', co2_per_capita: 1.9, co2: 2654, population: 1396000000 },
      { iso_code: 'RUS', country: 'Russia', co2_per_capita: 10.9, co2: 1589, population: 145900000 },
      { iso_code: 'ESH', country: 'Western Sahara', co2_per_capita: 0.5, co2: 0.3, population: 600000 },
      { iso_code: 'FLK', country: 'Falkland Islands', co2_per_capita: 5.0, co2: 0.02, population: 4000 },
      { iso_code: 'ATF', country: 'French Southern Territories', co2_per_capita: 0.0, co2: 0.0, population: 0 },
      { iso_code: 'PRI', country: 'Puerto Rico', co2_per_capita: 2.8, co2: 9.0, population: 3200000 },
      { iso_code: 'CIV', country: "Côte d'Ivoire", co2_per_capita: 0.4, co2: 11.0, population: 27000000 },
      { iso_code: 'PSE', country: 'Palestine', co2_per_capita: 0.6, co2: 3.0, population: 5000000 },
      { iso_code: 'ARE', country: 'United Arab Emirates', co2_per_capita: 23.0, co2: 215.0, population: 9300000 },
      { iso_code: 'VNM', country: 'Vietnam', co2_per_capita: 3.6, co2: 350.0, population: 97000000 },
      { iso_code: 'PRK', country: 'North Korea', co2_per_capita: 0.8, co2: 20.0, population: 25000000 },
      { iso_code: 'KOR', country: 'South Korea', co2_per_capita: 12.0, co2: 620.0, population: 51700000 },
      { iso_code: 'MDA', country: 'Moldova', co2_per_capita: 1.4, co2: 5.0, population: 3600000 },
      { iso_code: 'ATA', country: 'Antarctica', co2_per_capita: 0.0, co2: 0.0, population: 0 },
      { iso_code: 'CYP', country: 'Northern Cyprus', co2_per_capita: 2.5, co2: 1.0, population: 400000 },
      { iso_code: 'SOM', country: 'Somaliland', co2_per_capita: 0.2, co2: 1.0, population: 5000000 },
      { iso_code: 'XKX', country: 'Kosovo', co2_per_capita: 4.5, co2: 8.0, population: 1800000 },
      { iso_code: 'JPN', country: 'Japan', co2_per_capita: 8.6, co2: 1070, population: 125000000 },
      { iso_code: 'DEU', country: 'Germany', co2_per_capita: 8.1, co2: 675, population: 83000000 }
    ];

    let countryData = {};
    let isMapInitialized = false;
    let chartInstances = {};

    async function initializeGlobe() {
      if (isMapInitialized) return;
      isMapInitialized = true;

      globeContainer.innerHTML = ''; // Clear container
      legendContainer.style.display = 'block'; // Show legend

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
          console.warn('No data found for the map visualization. Using fallback data.');
          fallbackData.forEach(item => {
            countryData[item.iso_code.toUpperCase()] = {
              name: item.country,
              value: item.co2_per_capita,
              total_co2: item.co2,
              population: item.population
            };
          });
        }

        createMapVisualization();
      } catch (error) {
        console.error('Error loading CO₂ data:', error);
        console.warn('Using fallback CO₂ data.');
        fallbackData.forEach(item => {
          countryData[item.iso_code.toUpperCase()] = {
            name: item.country,
            value: item.co2_per_capita,
            total_co2: item.co2,
            population: item.population
          };
        });
        createMapVisualization();
      }
    }

    function createMapVisualization() {
      let width = Math.max(globeContainer.clientWidth, 800);
      let height = globeContainer.clientHeight * 0.9;
      const svg = d3.select(globeContainer)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

      svg.append('defs')
        .append('clipPath')
        .attr('id', 'map-clip')
        .append('rect')
        .attr('width', width)
        .attr('height', height);

      const g = svg.append('g')
        .attr('clip-path', 'url(#map-clip)');

      const tooltip = d3.select(globeContainer)
        .append('div')
        .attr('id', 'countryTooltip')
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
        .scale(width / 2.5 / Math.PI)
        .translate([width / 2, height / 1.5])
        .center([0, 0]);
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
              const numericCode = d.id || '999';
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
              const numericCode = d.id || '999';
              const alpha3Code = numericToAlpha3[numericCode];
              if (!alpha3Code || !countryData[alpha3Code]) return;

              d3.select(this).attr('fill', '#ff0000');
              updateCountryInfo(countryData[alpha3Code], event, tooltip, projection, path, d);
            })
            .on('mouseout', function (event, d) {
              const numericCode = d.id || '999';
              const alpha3Code = numericToAlpha3[numericCode];
              if (!alpha3Code || !countryData[alpha3Code]) {
                d3.select(this).attr('fill', '#cccccc');
                return;
              }
              d3.select(this).attr('fill', colorScale(countryData[alpha3Code].value || 0));
              tooltip.style('display', 'none');
              if (chartInstances[alpha3Code]) {
                chartInstances[alpha3Code].destroy();
                delete chartInstances[alpha3Code];
              }
            })
            .filter(d => !path(d))
            .remove();

          createLegend(colorScale, maxCo2);
        })
        .catch(error => {
          console.error('Error loading world map:', error);
          globeContainer.innerHTML = '<p style="color: #fff;">Error loading map. Please try again.</p>';
        });

      window.addEventListener('resize', () => {
        const newWidth = globeContainer.clientWidth;
        const newHeight = globeContainer.clientHeight * 0.9;
        svg.attr('width', newWidth).attr('height', newHeight);

        svg.select('#map-clip rect')
          .attr('width', newWidth)
          .attr('height', newHeight);

        projection.scale(newWidth / 4 / Math.PI)
          .translate([newWidth / 2, newHeight / 2]);

        g.selectAll('path').attr('d', path);

        svg.call(zoom.transform, d3.zoomIdentity);
      });
    }

    function createLegend(colorScale, maxValue) {
      legend.innerHTML = '';

      const title = document.createElement('div');
      title.textContent = 'CO₂ emissions per capita (tons)';
      title.style.color = '#fff';
      title.style.fontWeight = 'bold';
      title.style.marginBottom = '10px';
      legend.appendChild(title);

      const svg = d3.select(legend)
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

    async function updateCountryInfo(data, event, tooltip, projection, path, country) {
      if (!data || !data.value) {
        tooltip.style('display', 'none');
        return;
      }

      const chartId = `co2-chart-${data.iso_code || data.name.replace(/\s/g, '-')}`;

      let historicalData = [];
      try {
        const response = await fetch(`/api/emissions?country=${encodeURIComponent(data.name)}&metric=co2&startYear=2000&endYear=2022`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        historicalData = await response.json();
      } catch (error) {
        console.error(`Error fetching historical CO₂ data for ${data.name}:`, error);
        historicalData = [];
      }

      const years = historicalData.map(d => d.year);
      const co2Values = historicalData.map(d => d.value);

      const content = `
        <h5 style="margin: 0 0 5px; font-size: 14px; color: #2d3748; font-weight: 700;">${data.name}</h5>
        <table style="font-size: 12px; color: #2d3748; margin-bottom: 8px;">
          <tr>
            <td>CO₂ per capita:</td>
            <td style="padding-left: 8px;">${data.value ? data.value.toFixed(2) : 'N/A'} tons</td>
          </tr>
          <tr>
            <td>Total CO₂:</td>
            <td style="padding-left: 8px;">${data.total_co2 ? data.total_co2.toFixed(2) : 'N/A'} million tons</td>
          </tr>
          <tr>
            <td>Population:</td>
            <td style="padding-left: 8px;">${data.population ? data.population.toLocaleString() : 'N/A'}</td>
          </tr>
        </table>
        <div style="margin-top: 8px;">
          <canvas id="${chartId}" style="width: 200px; height: 100px;"></canvas>
        </div>
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

      const ctx = document.getElementById(chartId)?.getContext('2d');
      if (ctx) {
        if (chartInstances[data.iso_code]) {
          chartInstances[data.iso_code].destroy();
        }

        chartInstances[data.iso_code] = new Chart(ctx, {
          type: 'line',
          data: {
            labels: years,
            datasets: [{
              label: 'Total CO₂ (million tons)',
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
              tooltip: { enabled: false }
            },
            scales: {
              x: {
                display: true,
                ticks: {
                  maxTicksLimit: 5,
                  color: '#2d3748',
                  font: { size: 10 }
                },
                grid: { display: false }
              },
              y: {
                display: true,
                ticks: {
                  maxTicksLimit: 4,
                  color: '#2d3748',
                  font: { size: 10 },
                  callback: function(value) {
                    return value.toFixed(0);
                  }
                },
                grid: { color: 'rgba(0,0,0,0.05)' }
              }
            }
          }
        });
      }
    }

    // Initialize the globe
    initializeGlobe();
  };

  // Listen for tab content loaded event
  document.getElementById('tabContent')?.addEventListener('tabContentLoaded', function (e) {
    if (e.detail.tab === 'map.html') {
      window.initMap();
    }
  });
});