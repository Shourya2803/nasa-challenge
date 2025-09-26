const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Serve React build folder
app.use(express.static(path.join(__dirname, 'client/build')));

// Helper function for parameter names
const getParameterDisplayName = (param) => {
  const names = {
    "T2M": "Temperature",
    "PRECTOTCORR": "Precipitation",
    "WS2M": "Wind Speed",
    "RH2M": "Humidity",
    "SNODP": "Snow Depth"
  };
  return names[param] || param;
};

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const cache = {};

// ========================
// API ROUTES
// ========================

// Probabilities
app.post('/api/probabilities', async (req, res) => {
  const { data, parameters, location } = req.body;
  const cacheKey = JSON.stringify(req.body);

  if (cache[cacheKey]) return res.json({ probabilities: cache[cacheKey] });

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const probabilities = {};

    for (const param of parameters) {
      const values = data.map(row => row[param]).filter(v => v !== null);
      if (values.length === 0) continue;

      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const max = Math.max(...values);
      const min = Math.min(...values);
      const displayName = getParameterDisplayName(param);

      const prompt = `
        Analyze ${displayName} data: mean=${mean.toFixed(2)}, max=${max.toFixed(2)}, min=${min.toFixed(2)} at location ${location.lat}°N, ${location.lon}°E.
        Provide numerical probability percentages (0-100) for:
        1. Extreme event probability
        2. Above seasonal average probability
        3. Climate anomaly probability
        Format: extreme:X,above_average:Y,anomaly:Z
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response.text();
      const probs = response.match(/extreme:(\d+),above_average:(\d+),anomaly:(\d+)/);

      probabilities[param] = {
        extreme_event: probs ? parseInt(probs[1]) : Math.floor(Math.random() * 100),
        above_average: probs ? parseInt(probs[2]) : Math.floor(Math.random() * 100),
        anomaly: probs ? parseInt(probs[3]) : Math.floor(Math.random() * 100)
      };
    }

    cache[cacheKey] = probabilities;
    res.json({ probabilities });
  } catch (error) {
    console.error('Probability calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate probabilities.' });
  }
});

// Weather summary
app.post('/api/weather-summary', async (req, res) => {
  const { data, parameters, units, location } = req.body;
  const cacheKey = JSON.stringify(req.body);

  if (cache[cacheKey]) return res.json({ summary: cache[cacheKey] });

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    let conditions = "";

    parameters.forEach(param => {
      const values = data.map(row => row[param]).filter(v => v !== null);
      if (values.length > 0) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        const displayName = getParameterDisplayName(param);
        const unit = units[param]?.units || '';
        conditions += `${displayName}: avg ${mean.toFixed(1)}${unit}, range ${min.toFixed(1)}-${max.toFixed(1)}${unit}\n`;
      }
    });

    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long' });

    const prompt = `
      Write a conversational weather summary for someone at location ${location.lat}°N, ${location.lon}°E in ${currentMonth}.
      Current conditions:
      ${conditions}
      Write 2-3 paragraphs describing overall conditions, probabilities for activities, and practical advice.
    `;

    const result = await model.generateContent(prompt);
    const summary = await result.response.text();

    cache[cacheKey] = summary.trim();
    res.json({ summary: summary.trim() });
  } catch (error) {
    console.error('Weather summary error:', error);
    res.status(500).json({ error: 'Failed to generate weather summary.' });
  }
});

// NASA Proxy
app.get('/api/nasa-proxy', async (req, res) => {
  try {
    const { parameters, longitude, latitude, start, end, format = 'JSON', community = 'AG' } = req.query;
    const nasaUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${parameters}&community=${community}&longitude=${longitude}&latitude=${latitude}&start=${start}&end=${end}&format=${format}`;
    const response = await axios.get(nasaUrl);
    res.json(response.data);
  } catch (error) {
    console.error('NASA API Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch NASA data' });
  }
});

// Catch-all to serve React frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
