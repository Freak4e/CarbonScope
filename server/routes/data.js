const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");

let emissionsData = [];
let animatedGraphData = []; 
let sectorEmissionsData = [];
let fuelEmissionsData = [];
const csvPath = path.join(__dirname, "../../data/co2-data.csv");
const animatedGraphCsvPath = path.join(__dirname, "../../data/animatedgraph.csv");
const sectorCsvPath = path.join(__dirname, "../../data/co2-sectors.csv");
const fuelCsvPath = path.join(__dirname, "../../data/co2-fuel.csv");
const economicSectorsCsvPath = path.join(__dirname, "../../data/co-emissions-by-sector.csv");
const geojsonPath = path.join(__dirname, "../../data/slovenia.geojson");

// Add at the top of your routes file
router.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
// Load and preprocess CSV data
fs.createReadStream(csvPath)
  .pipe(csv())
  .on("data", (row) => {
    // Convert numeric fields
    const processedRow = {};
    for (const [key, value] of Object.entries(row)) {
      processedRow[key] = isNaN(value) ? value : parseFloat(value);
    }
    emissionsData.push(processedRow);
  })
  .on("end", () => {
    console.log("CSV data loaded with", emissionsData.length, "records");
  });

  // Load animatedgraph.csv
fs.createReadStream(animatedGraphCsvPath)
.pipe(csv())
.on("data", (row) => {
  if (row.Entity === "World" && row.Year && row["Annual CO₂ emissions"]) {
    animatedGraphData.push({
      year: parseInt(row.Year),
      co2: parseFloat(row["Annual CO₂ emissions"]) / 1e9 // Convert tons to billions
    });
  }
})
.on("end", () => {
  console.log("animatedgraph.csv loaded with", animatedGraphData.length, "records");
});

fs.createReadStream(sectorCsvPath)
  .pipe(csv())
  .on('data', (row) => {
    sectorEmissionsData.push(row);
  })
  .on('end', () => {
    console.log('Sector emissions CSV loaded, total rows:', sectorEmissionsData.length);
  });

fs.createReadStream(fuelCsvPath)
  .pipe(csv())
  .on('data', (row) => {
    fuelEmissionsData.push(row);
  })
  .on('end', () => {
    console.log('Fuel emissions CSV loaded, total rows:', fuelEmissionsData.length);
  });

  router.get('/api/slovenia-geojson', (req, res) => {
  fs.readFile(geojsonPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading GeoJSON:', err);
      return res.status(500).json({ error: 'Failed to load GeoJSON' });
    }
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  });
});

// Get available metrics
router.get("/api/metrics", (req, res) => {
  const metrics = [
    { id: "co2", name: "CO₂ Emissions", unit: "million tonnes" },
    { id: "co2_per_capita", name: "Per Capita CO₂", unit: "tonnes per person" },
    { id: "co2_per_gdp", name: "CO₂ Intensity (GDP)", unit: "kg per $" },
    { id: "share_global_co2", name: "Global Share", unit: "%" },
    { id: "temperature_change_from_co2", name: "Temp Impact", unit: "°C" }
  ];
  res.json(metrics);
});

// Get countries with available data
router.get("/api/countries", (req, res) => {
  const countries = [...new Set(emissionsData.map(item => item.country))]
    .filter(c => c) // Remove empty values
    .sort();
  res.json(countries);
});

// Get emissions data with flexible filtering
router.get("/api/emissions", (req, res) => {
  try {
    const { country, metric, startYear, endYear } = req.query;
    
    let filteredData = emissionsData;
    
    if (country) {
      const countries = Array.isArray(country) ? country : [country];
      filteredData = filteredData.filter(item => countries.includes(item.country));
    }
  
  if (country) {
    filteredData = filteredData.filter(item => item.country === country);
  }
  
  if (metric) {
    filteredData = filteredData.filter(item => item[metric] !== undefined);
  }
  
  if (startYear) {
    filteredData = filteredData.filter(item => item.year >= parseInt(startYear));
  }
  
  if (endYear) {
    filteredData = filteredData.filter(item => item.year <= parseInt(endYear));
  }
  
  // Format response
  const response = filteredData.map(item => ({
  year: item.year,
  value: item[metric] || item.co2,
  country: item.country,
  iso_code: item.iso_code,
  population: item.population,
  gdp: item.gdp,
  co2_per_gdp: item.co2_per_gdp,
  energy_per_gdp: item.energy_per_gdp,
  co2_growth_prct: item.co2_growth_prct,
  co2_per_capita: item.co2_per_capita
  })).sort((a, b) => a.year - b.year);
  
   res.json(response);
  } catch (error) {
    console.error('Error in emissions endpoint:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get country summary statistics
// Modify your existing summary endpoint
router.get("/api/summary/:country", (req, res) => {
  const countryData = emissionsData.filter(item => item.country === req.params.country);
  
  if (countryData.length === 0) {
    return res.status(404).json({ error: "Country not found" });
  }
  
  const latestYear = Math.max(...countryData.map(item => item.year));
  const latestData = countryData.find(item => item.year === latestYear);
  
  const summary = {
    country: req.params.country,
    latestYear,
    co2: latestData.co2,
    co2_per_capita: latestData.co2_per_capita,
    share_global_co2: latestData.share_global_co2,
    population: latestData.population,
    gdp: latestData.gdp,
    trend: calculateTrend(countryData, "co2"),
    sectors: {
      coal: latestData.coal_co2 || 0,
      oil: latestData.oil_co2 || 0,
      gas: latestData.gas_co2 || 0,
      cement: latestData.cement_co2 || 0,
      flaring: latestData.flaring_co2 || 0,
      other: latestData.other_co2 || 0
    }
  };
  
  res.json(summary);
});
// Helper function to calculate trends
function calculateTrend(data, metric) {
  if (data.length < 2) return 0;
  
  const sorted = [...data].sort((a, b) => a.year - b.year);
  const first = sorted[0][metric];
  const last = sorted[sorted.length - 1][metric];
  const years = sorted[sorted.length - 1].year - sorted[0].year;
  
  return years > 0 ? ((last - first) / years) : 0;
}
// Get filtered countries based on search term
router.get("/api/countries/search", (req, res) => {
  const searchTerm = (req.query.q || '').toLowerCase();
  const limit = parseInt(req.query.limit) || 10;
  
  const countries = [...new Set(emissionsData.map(item => item.country))]
    .filter(c => c && c.toLowerCase().includes(searchTerm))
    .sort()
    .slice(0, limit);
    
  res.json(countries);
});
// Add this to your API routes (before module.exports)
router.get("/api/sectors/:country", (req, res) => {
  const { country } = req.params;
  const year = req.query.year || Math.max(...emissionsData.map(item => item.year));
  
  const countryYearData = emissionsData.find(item => 
    item.country === country && item.year == year
  );
  
  if (!countryYearData) {
    return res.status(404).json({ error: "Data not found" });
  }
  
  const sectors = {
    coal_co2: countryYearData.coal_co2 || 0,
    oil_co2: countryYearData.oil_co2 || 0,
    gas_co2: countryYearData.gas_co2 || 0,
    cement_co2: countryYearData.cement_co2 || 0,
    flaring_co2: countryYearData.flaring_co2 || 0,
    other_co2: countryYearData.other_co2 || 0
  };
  
  res.json({
    country,
    year,
    sectors
  });
});

router.get("/api/energy-metrics", async (req, res) => {
  try {
    const { countries, year } = req.query;
    const countryList = countries.split(',');
    
    const results = countryList.map(country => {
      const data = emissionsData.find(item => 
        item.country === country && item.year == year
      );
      
      return data ? {
        country: country,
        iso_code: data.iso_code,
        co2_per_gdp: data.co2_per_gdp,
        energy_per_gdp: data.energy_per_gdp,
        co2_per_capita: data.co2_per_capita,
        energy_per_capita: data.energy_per_capita
      } : null;
    }).filter(Boolean);

    res.json(results);
  } catch (error) {
    console.error('Error fetching energy metrics:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get historical trends for multiple countries
router.get("/api/trends", async (req, res) => {
  try {
    const { countries, startYear, endYear } = req.query;
    const countryList = countries.split(',');
    
    const results = await Promise.all(
      countryList.map(async country => {
        const countryData = emissionsData.filter(item => 
          item.country === country && 
          item.year >= startYear && 
          item.year <= endYear
        ).sort((a, b) => a.year - b.year);
        
        return {
          country,
          data: countryData.map(d => ({
            year: d.year,
            co2: d.co2,
            co2_growth_prct: d.co2_growth_prct,
            co2_per_capita: d.co2_per_capita,
            co2_per_gdp: d.co2_per_gdp
          }))
        };
      })
    );

    res.json(results);
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get global sector breakdown
router.get("/api/global-sectors", (req, res) => {
  try {
    const year = req.query.year || Math.max(...emissionsData.map(item => item.year));
    
    // Aggregate global sector data
    const globalData = emissionsData.filter(item => item.year == year);
    
    const sectors = {
      coal_co2: globalData.reduce((sum, item) => sum + (item.coal_co2 || 0), 0),
      oil_co2: globalData.reduce((sum, item) => sum + (item.oil_co2 || 0), 0),
      gas_co2: globalData.reduce((sum, item) => sum + (item.gas_co2 || 0), 0),
      cement_co2: globalData.reduce((sum, item) => sum + (item.cement_co2 || 0), 0),
      flaring_co2: globalData.reduce((sum, item) => sum + (item.flaring_co2 || 0), 0),
      other_co2: globalData.reduce((sum, item) => sum + (item.other_co2 || 0), 0)
    };
    
    // Calculate percentages
    const total = Object.values(sectors).reduce((sum, val) => sum + val, 0);
    const percentages = {};
    Object.keys(sectors).forEach(key => {
      percentages[key] = total > 0 ? (sectors[key] / total * 100) : 0;
    });
    
    res.json({
      year,
      total_co2: total,
      sectors,
      percentages
    });
  } catch (error) {
    console.error('Error fetching global sectors:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get top emitting countries
router.get("/api/top-emitters", (req, res) => {
  try {
    const { year, limit = 10 } = req.query;
    const targetYear = year || Math.max(...emissionsData.map(item => item.year));
    
    const yearData = emissionsData.filter(item => item.year == targetYear);
    
    // Sort by CO2 emissions (descending) and take top N
    const topEmitters = [...yearData]
      .sort((a, b) => (b.co2 || 0) - (a.co2 || 0))
      .slice(0, limit)
      .map(item => ({
        country: item.country,
        iso_code: item.iso_code,
        co2: item.co2,
        co2_per_capita: item.co2_per_capita,
        share_global_co2: item.share_global_co2
      }));
    
    res.json({
      year: targetYear,
      emitters: topEmitters
    });
  } catch (error) {
    console.error('Error fetching top emitters:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/api/globe-data", (req, res) => {
  try {
    const targetYear = 2022; 
    const metric = "co2_per_capita"; 
    
    // Filter data for the target year and where co2_per_capita exists
    const filteredData = emissionsData.filter(item => 
      item.year === targetYear && 
      item.co2_per_capita != null &&
      item.iso_code
    );
    
    // Format the response with only needed fields
    const response = filteredData.map(item => ({
      year: item.year,
      country: item.country,
      iso_code: item.iso_code,
      co2_per_capita: item.co2_per_capita,
      co2: item.co2,
      population: item.population
    }));
    
    res.json(response);
  } catch (error) {
    console.error('Error in globe-data endpoint:', error);
  }
});

router.get("/api/slovenia-per-capita", (req, res) => {
  try {
    const filteredData = emissionsData
      .filter(item =>
        item.country === "Slovenia" &&
        item.co2_per_capita !== undefined &&
        item.year >= 2000 &&
        item.year <= 2022
      )
      .map(item => ({
        year: item.year,
        co2_per_capita: item.co2_per_capita,
        population: item.population,
        gdp: item.gdp,
        iso_code: item.iso_code,
      }))
      .sort((a, b) => a.year - b.year);

    res.json(filteredData);
  } catch (error) {
    console.error("Error fetching Slovenia per capita data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
const absChangeCsvPath = path.join(__dirname, "../../data/absolute-change-co2.csv");

let absChangeData = [];

fs.createReadStream(absChangeCsvPath)
  .pipe(csv())
  .on("data", (row) => {
    const processedRow = {};
    for (const [key, value] of Object.entries(row)) {
      processedRow[key] = isNaN(value) ? value : parseFloat(value);
    }
    absChangeData.push(processedRow);
  })
  .on("end", () => {
    console.log("Absolute CO2 change CSV loaded with", absChangeData.length, "records");
  });

router.get("/api/slovenia-absolute-change", (req, res) => {
  try {
    const sloveniaData = absChangeData
      .filter(item => item.Entity === "Slovenia")
      .map(item => ({
        year: item.Year,
        value: item["Annual CO₂ emissions growth (abs)"]
      }))
      .sort((a, b) => a.year - b.year);

    if (!sloveniaData.length) {
      return res.status(404).json({ error: "No Slovenia data found" });
    }

    res.json(sloveniaData);
  } catch (error) {
    console.error("Error fetching Slovenia absolute change data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/api/animated-graph", (req, res) => {
  try {
    const response = animatedGraphData
      .filter(item => item.year >= 1750 && item.year <= 2023)
      .map(item => ({
        year: item.year,
        co2: item.co2 // Already in billions
      }))
      .sort((a, b) => a.year - b.year);
    
    res.json(response);
  } catch (error) {
    console.error('Error in animated-graph endpoint:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/api/emissions-by-fuel-extended", (req, res) => {
  try {
    const country = "Slovenia";
    const fuelColumns = {
      coal_co2: "Premog",
      oil_co2: "Nafta",
      gas_co2: "Zemeljski plin",
      cement_co2: "Cement",
      flaring_co2: "Sežiganje",
      other_co2: "Drugo"
    };

    const data = emissionsData
      .filter(item => item.country === country && item.year)
      .flatMap(item =>
        Object.entries(fuelColumns).map(([column, fuelName]) => ({
          fuel: fuelName,
          year: parseInt(item.year),
          value: item[column] !== undefined && item[column] !== "" ? parseFloat(item[column]) : 0,
          unit: "Mt CO2"
        }))
      )
      .filter(item => !isNaN(item.value) && item.year >= 1991 && item.year <= 2022)
      .sort((a, b) => a.year - b.year || a.fuel.localeCompare(b.fuel));

    if (!data.length) {
      return res.status(404).json({ error: "No fuel emissions data found for Slovenia" });
    }

    res.json(data);
  } catch (error) {
    console.error("Error fetching extended fuel emissions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get('/api/emissions-by-fuel-comparison', (req, res) => {
  try {
        const regions = ['Slovenia', 'European Union (27)', 'World'];
        const fuelMap = {
            'coal_co2': 'Premog',
            'oil_co2': 'Nafta',
            'gas_co2': 'Zemeljski plin',
            'cement_co2': 'Cement',
            'flaring_co2': 'Sežiganje',
            'other_co2': 'Drugo'
        };

        const data = regions.flatMap(region => {
            return emissionsData
                .filter(item => item.country === region && item.year && item.population)
                .flatMap(item => {
                    return Object.entries(fuelMap).map(([column, fuelLabel]) => ({
                        region: region,
                        fuel: fuelLabel,
                        year: parseInt(item.year),
                        value: item[column]? parseFloat(item[column]) : 0,
                        perCapita: item[column] && item.population ? parseFloat(item[column]) / item.population * 1e6 : 0, // Mt to t per person
                        unit: 't CO₂/osebo'
                    }));
                });
        })
        .filter(item => !isNaN(item.value) && item.year >= 1991 && item.year <= 2022)
        .sort((a, b) => a.year - b.year || a.region.localeCompare(b.region) || a.fuel.localeCompare(b.fuel));

        if (!data.length) {
            return res.status(404).json({ error: 'No fuel emissions data found' });
        }

        res.json(data);
    } catch (error) {
        console.error('Error fetching fuel comparison data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get("/api/emissions-by-sector", (req, res) => {
  try {
    const data = sectorEmissionsData
      .filter(item => item['CO2 emissions by sector in Slovenia'] && item.Value !== undefined && item.Year)
      .map(item => ({
        sector: item['CO2 emissions by sector in Slovenia'],
        year: parseInt(item.Year),
        value: parseFloat(item.Value),
        unit: item.Units,
      }))
      .sort((a, b) => a.year - b.year);

    res.json(data);
  } catch (error) {
    console.error("Error fetching emissions by sector:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.get("/api/transport-emissions", (req, res) => {
  try {
    const data = sectorEmissionsData
      .filter(item => item['CO2 emissions by sector in Slovenia'] === "Transport Sector" && item.Value !== undefined)
      .map(item => ({
        year: parseInt(item.Year),
        value: parseFloat(item.Value),
        unit: item.Units,
      }))
      .sort((a, b) => a.year - b.year);

    res.json(data);
  } catch (error) {
    console.error("Error fetching transport emissions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.get("/api/top5-emitting-sectors", (req, res) => {
  try {
    const allValidYears = sectorEmissionsData
      .filter(item => item.Year && item.Value !== undefined)
      .map(item => parseInt(item.Year));

    const latestYear = Math.max(...allValidYears);

    const data = sectorEmissionsData
      .filter(item => parseInt(item.Year) === latestYear && item.Value !== undefined)
      .map(item => ({
        sector: item['CO2 emissions by sector in Slovenia'],
        value: parseFloat(item.Value),
        unit: item.Units,
        year: parseInt(item.Year),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    res.json(data);
  } catch (error) {
    console.error("Error fetching top 5 emitting sectors:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/api/emissions-by-fuel", (req, res) => {
  try {
    const data = fuelEmissionsData
      .filter(item =>
        item["CO2 emissions by fuel in Slovenia"] &&
        item.Value !== undefined &&
        item.Year
      )
      .map(item => ({
        fuel: item["CO2 emissions by fuel in Slovenia"],
        year: parseInt(item.Year),
        value: parseFloat(item.Value),
        unit: item.Units.trim(),
      }))
      .sort((a, b) => a.year - b.year);

    res.json(data);
  } catch (error) {
    console.error("Error fetching emissions by fuel:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get('/api/emissions-extended', (req, res) => {
  try {
    const { country, metric, startYear, endYear } = req.query;
    let filteredData = emissionsData;

    if (country) {
      const countries = Array.isArray(country) ? country : [country];
      filteredData = filteredData.filter(item => countries.includes(item.country));
    }
    if (metric) {
      filteredData = filteredData.filter(item => item[metric] !== undefined && item[metric] !== '');
    }
    if (startYear) {
      filteredData = filteredData.filter(item => item.year >= parseInt(startYear));
    }
    if (endYear) {
      filteredData = filteredData.filter(item => item.year <= parseInt(endYear));
    }

    const response = filteredData.map(item => ({
      year: item.year,
      value: item[metric] || item.co2,
      country: item.country,
      iso_code: item.iso_code,
      population: item.population,
      gdp: item.gdp,
      gdp_per_capita: item.gdp && item.population ? item.gdp / item.population : null,
      co2_per_gdp: item.co2_per_gdp,
      energy_per_gdp: item.primary_energy_consumption && item.gdp ? item.primary_energy_consumption / item.gdp : null,
      co2_growth_prct: item.co2_growth_prct,
      co2_per_capita: item.co2_per_capita,
      share_global_co2: item.share_global_co2,
      primary_energy_consumption: item.primary_energy_consumption
    })).filter(item => item.year && (item.value || item.gdp_per_capita || item.energy_per_gdp))
      .sort((a, b) => a.year - b.year);

    res.json(response);
  } catch (error) {
    console.error('Error in emissions-extended endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.get("/api/top_countries", (req, res) => {
  try {
    const { startYear = 1750, endYear = 2023 } = req.query;
    const topCountries = [
      "China",
      "United States",
      "India",
      "Russia",
      "Japan",
      "Iran",
      "Germany",
      "United Kingdom"
    ];

    // Filter data for top countries and year range
    const filteredData = emissionsData
      .filter(
        (item) =>
          topCountries.includes(item.country) &&
          item.year >= parseInt(startYear) &&
          item.year <= parseInt(endYear) &&
          item.co2 != null &&
          item.share_global_co2 != null,
      )
      .map((item) => ({
        country: item.country,
        year: item.year,
        iso_code: item.iso_code,
        co2: item.co2 / 1000, // Convert million tonnes to billion tonnes
        share_global_co2: item.share_global_co2, // Percentage
      }))
      .sort((a, b) => a.year - b.year || a.country.localeCompare(b.country));

    res.json({
      yearRange: { start: parseInt(startYear), end: parseInt(endYear) },
      countries: topCountries,
      data: filteredData,
    });
  } catch (error) {
    console.error("Error in top_countries endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.get('/api/sector-emissions', (req, res) => {
  const { entity, year } = req.query;
  const records = [];

  // Parse year range if provided (format: "startYear:endYear")
  let yearRange = {};
  if (year && year.includes(':')) {
    const [startYear, endYear] = year.split(':').map(y => parseInt(y));
    if (!isNaN(startYear) && !isNaN(endYear)) {
      yearRange = { start: startYear, end: endYear };
    }
  }

  fs.createReadStream(economicSectorsCsvPath)
    .pipe(csv({ columns: true, skip_empty_lines: true }))
    .on('data', (data) => {
      const recordYear = parseInt(data.Year);
      
      // Apply entity filter
      const entityMatch = !entity || 
                         data.Entity.toLowerCase() === entity.toLowerCase();
      
      // Apply year filter
      let yearMatch = true;
      if (year) {
        if (yearRange.start) {
          // Check if year is within range
          yearMatch = recordYear >= yearRange.start && recordYear <= yearRange.end;
        } else {
          // Check exact year match
          yearMatch = recordYear === parseInt(year);
        }
      }

      if (entityMatch && yearMatch) {
        records.push(data);
      }
    })
    .on('end', () => {
      if (records.length === 0) {
        console.warn(`No records found for entity: ${entity || 'any'}, year: ${year || 'any'}`);
        return res.status(404).json({ error: 'No data found for the specified filters' });
      }
      console.log(`Returning ${records.length} records for entity: ${entity || 'any'}, year: ${year || 'any'}`);
      res.json(records);
    })
    .on('error', (err) => {
      console.error('Error reading CSV file:', err.message);
      res.status(500).json({ error: 'Failed to read CSV file', details: err.message });
    });
});

module.exports = router;
