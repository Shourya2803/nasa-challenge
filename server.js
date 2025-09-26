const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "client/build")));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/build", "index.html"));
});

// Simple in-memory cache
const cache = {};
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

// Helper: cache key
function getCacheKey(location1, location2) {
  return `${location1}_${location2}`;
}

// Endpoint for Gemini Insights
app.post('/api/gemini-insights', async (req, res) => {
  try {
    const { location1, location2, weatherData1, weatherData2 } = req.body;
    const cacheKey = getCacheKey(location1, location2);

    // Serve from cache if fresh
    if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
      return res.json({ insights: cache[cacheKey].data });
    }

    const prompt = `
Compare the following two locations and provide insights in a simple way for kids to understand:
Location 1 (${location1}): ${JSON.stringify(weatherData1)}
Location 2 (${location2}): ${JSON.stringify(weatherData2)}

Make it easy, clear, and fun!
    `;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    const insights = data?.candidates?.[0]?.content?.parts?.[0]?.text || 
      "No insights generated.";

    // Save in cache
    cache[cacheKey] = {
      data: insights,
      timestamp: Date.now()
    };

    res.json({ insights });
  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: "Failed to fetch insights" });
  }
});

// ---------- Serve React frontend in production ----------
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// ---------- Start server ----------
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
