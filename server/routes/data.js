const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");

let emissionsData = [];
const csvPath = path.join(__dirname, "../../data/co2-data.csv");
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
module.exports = router;