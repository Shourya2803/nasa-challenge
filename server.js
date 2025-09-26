
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

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

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const cache = {};

app.post('/api/probabilities', async (req, res) => {
  const { data, parameters, units, location } = req.body;
  const cacheKey = JSON.stringify(req.body);

  if (cache[cacheKey]) {
    return res.json({ probabilities: cache[cacheKey] });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
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
        
        Provide only numerical probability percentages (0-100) for:
        1. Extreme event probability
        2. Above seasonal average probability  
        3. Climate anomaly probability
        
        Format: extreme:X,above_average:Y,anomaly:Z
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response.text();
      
      // Parse probabilities from response
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

app.post('/api/weather-summary', async (req, res) => {
  const { data, parameters, units, location } = req.body;
  const cacheKey = JSON.stringify(req.body);

  if (cache[cacheKey]) {
    return res.json({ summary: cache[cacheKey] });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
    
    let conditions = "";
    parameters.forEach(param => {
      const values = data.map(row => row[param]).filter(v => v !== null);
      if (values.length > 0) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        const displayName = getParameterDisplayName(param);
        const unit = units[param]?.units || '';
        
        conditions += `${displayName}: average ${mean.toFixed(1)}${unit}, range ${min.toFixed(1)}-${max.toFixed(1)}${unit}\n`;
      }
    });

    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long' });
    
    const prompt = `
      Write a conversational, plain English weather summary for someone at location ${location.lat}°N, ${location.lon}°E in ${currentMonth}. 

      Current conditions:
      ${conditions}

      Write 2-3 paragraphs that:
      1. Describe the overall weather conditions in simple terms
      2. Give specific probability estimates for activities (hiking, outdoor events, farming, travel)
      3. Provide practical advice and recommendations

      Use phrases like "there's a X% chance", "conditions are mostly", "you can expect", "it's ideal/not ideal for".
      Write like you're talking to a friend, not a weather report.
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

app.post('/api/parameter-insights', async (req, res) => {
  const { param, values, unit, location } = req.body;
  const cacheKey = JSON.stringify(req.body);

  if (cache[cacheKey]) {
    return res.json({ interpretation: cache[cacheKey] });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
    const displayName = getParameterDisplayName(param);
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const latest = values[values.length - 1];
    
    const prompt = `
      Analyze this ${displayName} data for location (${location.lat}, ${location.lon}):
      Values: ${values.slice(-10).join(', ')} ${unit}
      Mean: ${mean.toFixed(2)}${unit}, Min: ${min.toFixed(2)}${unit}, Max: ${max.toFixed(2)}${unit}
      
      Provide a brief interpretation (2-3 sentences) including:
      1. Probability of extreme events or anomalies
      2. Comparison to typical seasonal patterns
      3. Any notable trends or concerns
      
      Format: Start with a probability statement, then context. Be specific and actionable.
    `;

    const result = await model.generateContent(prompt);
    const interpretation = await result.response.text();
    
    cache[cacheKey] = interpretation.trim();
    res.json({ interpretation: interpretation.trim() });
  } catch (error) {
    console.error('Parameter insight error:', error);
    res.json({ interpretation: 'Analysis unavailable' });
  }
});

app.post('/api/insights', async (req, res) => {
  const { data, parameters, units, location } = req.body;
  const cacheKey = JSON.stringify(req.body);

  if (cache[cacheKey]) {
    return res.json({ insights: cache[cacheKey] });
  }

  if (!data || data.length === 0) {
    return res.status(400).json({ error: 'Weather data is required.' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

    let summary_text = "";
    let trend_analysis = "";
    
    parameters.forEach(param => {
        const values = data.map(row => row[param]).filter(v => v !== null);
        if (values.length > 0) {
            const mean_val = values.reduce((a, b) => a + b, 0) / values.length;
            const min_val = Math.min(...values);
            const max_val = Math.max(...values);
            const latest_val = values[values.length - 1];
            const first_val = values[0];
            const displayName = getParameterDisplayName(param);
            const unit = units[param]?.units || '';

            const trend = latest_val > first_val ? "increasing" : latest_val < first_val ? "decreasing" : "stable";
            const change_percent = first_val !== 0 ? ((latest_val - first_val) / first_val * 100).toFixed(1) : '0';

            summary_text +=
                `${displayName}: mean=${mean_val.toFixed(2)}${unit}, ` +
                `min=${min_val.toFixed(2)}${unit}, ` +
                `max=${max_val.toFixed(2)}${unit}, ` +
                `latest=${latest_val.toFixed(2)}${unit}\n`;
                
            trend_analysis += 
                `${displayName} trend: ${trend} (${change_percent}% change)\n`;
        }
    });

    const prompt = `Analyze weather data for location ${location.lat}°N, ${location.lon}°E:

${summary_text}

${trend_analysis}

Provide analysis in these sections:
1. TREND ANALYSIS: Key patterns observed
2. PREDICTIONS: Expected conditions next 7-30 days  
3. ALERTS: Any extreme values or concerns
4. RECOMMENDATIONS: Practical advice for agriculture, events, travel
5. SEASONAL CONTEXT: Comparison to typical patterns

Keep response concise and actionable.`;

    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    cache[cacheKey] = text;
    res.json({ insights: text });
  } catch (error) {
    console.error('Error generating insights:', error.message);
    
    // Fallback analysis
    summary_text = "";
    recommendations = "";
    
    parameters.forEach(param => {
        const values = data.map(row => row[param]).filter(v => v !== null);
        if (values.length > 0) {
            const mean_val = values.reduce((a, b) => a + b, 0) / values.length;
            const displayName = getParameterDisplayName(param);
            const unit = units[param]?.units || '';
            summary_text += `${displayName}: Average ${mean_val.toFixed(1)}${unit}\n`;
            
            if (param === 'T2M' && mean_val > 30) recommendations += "- High temperatures: Stay hydrated\n";
            if (param === 'PRECTOTCORR' && mean_val > 5) recommendations += "- High precipitation: Plan indoor activities\n";
        }
    });

    // Enhanced fallback analysis
    summary_text = "";
    recommendations = "";
    let alerts = "";
    
    parameters.forEach(param => {
        const values = data.map(row => row[param]).filter(v => v !== null);
        if (values.length > 0) {
            const mean_val = values.reduce((a, b) => a + b, 0) / values.length;
            const max_val = Math.max(...values);
            const min_val = Math.min(...values);
            const displayName = getParameterDisplayName(param);
            const unit = units[param]?.units || '';
            
            summary_text += `${displayName}: Average ${mean_val.toFixed(1)}${unit} (Range: ${min_val.toFixed(1)}-${max_val.toFixed(1)}${unit})\n`;
            
            // Enhanced recommendations
            if (param === 'T2M') {
                if (mean_val > 35) {
                    recommendations += "🔸 Extreme heat: Avoid outdoor activities 10am-4pm, stay hydrated\n";
                    alerts += "⚠️ Heat wave conditions detected\n";
                } else if (mean_val > 30) {
                    recommendations += "🔸 High temperatures: Stay hydrated, seek shade during peak hours\n";
                } else if (mean_val < 5) {
                    recommendations += "🔸 Cold conditions: Dress warmly, protect pipes from freezing\n";
                    alerts += "❄️ Freezing temperatures possible\n";
                }
            } else if (param === 'PRECTOTCORR') {
                if (mean_val > 10) {
                    recommendations += "🔸 Heavy rainfall: Avoid flood-prone areas, check drainage\n";
                    alerts += "🌧️ Heavy precipitation alert\n";
                } else if (mean_val > 5) {
                    recommendations += "🔸 High precipitation: Plan indoor activities, carry umbrella\n";
                } else if (mean_val < 0.1) {
                    recommendations += "🔸 Dry conditions: Water conservation, irrigation planning\n";
                }
            } else if (param === 'WS2M') {
                if (mean_val > 15) {
                    recommendations += "🔸 Strong winds: Secure loose objects, avoid high-profile vehicles\n";
                    alerts += "💨 High wind warning\n";
                } else if (mean_val > 10) {
                    recommendations += "🔸 Moderate winds: Be cautious with outdoor activities\n";
                }
            } else if (param === 'RH2M') {
                if (mean_val > 80) {
                    recommendations += "🔸 High humidity: Expect muggy conditions, stay cool\n";
                } else if (mean_val < 30) {
                    recommendations += "🔸 Low humidity: Use moisturizer, stay hydrated\n";
                }
            }
        }
    });

    const insights = `1. TREND ANALYSIS:
Weather patterns analyzed for location ${location.lat}°N, ${location.lon}°E
Data shows ${parameters.length} parameter${parameters.length > 1 ? 's' : ''} over ${data.length} day${data.length > 1 ? 's' : ''}

2. CURRENT CONDITIONS:
${summary_text}
3. WEATHER ALERTS:
${alerts || "✅ No weather alerts for current conditions\n"}
4. PREDICTIONS:
Based on current patterns, expect similar conditions to continue with normal seasonal variations over the next 7-14 days.

5. RECOMMENDATIONS:
${recommendations || "🔸 Monitor daily weather forecasts\n🔸 Follow standard seasonal preparations\n"}
6. SEASONAL CONTEXT:
Conditions appear typical for this geographic location and time period.

Note: Enhanced analysis available when AI service resumes.`;

    res.json({ insights });
  }
});

// AI-powered city recommendation
app.post('/api/city-recommendation', async (req, res) => {
  const cacheKey = JSON.stringify(req.body);

  if (cache[cacheKey]) {
    return res.json({ recommendation: cache[cacheKey] });
  }

  try {
    const { location1, location2, purpose } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a travel and location advisor AI. Analyze the user's query and select the BEST city between the two options.

USER'S PURPOSE: "${purpose}"

CITY 1: ${location1.name}
- Average Temperature: ${location1.data.avgTemp.toFixed(1)}°C
- Hot Days (>30°C): ${location1.data.hotDays.toFixed(0)}%
- Rainy Days: ${location1.data.rainyDays.toFixed(0)}%
- Average Wind: ${location1.data.avgWind.toFixed(1)} m/s
- Precipitation: ${location1.data.avgPrecip.toFixed(1)}mm

CITY 2: ${location2.name}
- Average Temperature: ${location2.data.avgTemp.toFixed(1)}°C
- Hot Days (>30°C): ${location2.data.hotDays.toFixed(0)}%
- Rainy Days: ${location2.data.rainyDays.toFixed(0)}%
- Average Wind: ${location2.data.avgWind.toFixed(1)} m/s
- Precipitation: ${location2.data.avgPrecip.toFixed(1)}mm

INSTRUCTIONS:
1. Analyze the user's purpose and what weather conditions would be ideal for it
2. Compare both cities against these ideal conditions
3. Select ONE city as the clear winner
4. Provide specific reasons why this city is better for their purpose

Format your response as:
🏆 WINNER: [City Name]

REASON: [2-3 sentences explaining why this city is better for their specific purpose, mentioning specific weather data points]`;

    const result = await model.generateContent(prompt);
    const recommendation = result.response.text();

    cache[cacheKey] = recommendation;
    res.json({ recommendation });
  } catch (error) {
    console.error('City Recommendation Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate city recommendation',
      message: error.message 
    });
  }
});

// Gemini-powered weather summary
app.post('/api/gemini-summary', async (req, res) => {
  const cacheKey = JSON.stringify(req.body);

  if (cache[cacheKey]) {
    return res.json({ summary: cache[cacheKey] });
  }

  try {
    const { data, parameters, units, location, forecasts } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Prepare current conditions
    const latest = data[data.length - 1];
    const currentConditions = {};
    parameters.forEach(param => {
      if (latest[param] !== null) {
        currentConditions[param] = {
          value: latest[param],
          unit: units[param]?.units || ''
        };
      }
    });

    // Calculate statistics
    const statistics = {};
    parameters.forEach(param => {
      const values = data.map(d => d[param]).filter(v => v !== null && !isNaN(v));
      if (values.length > 0) {
        statistics[param] = {
          average: (values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(2),
          min: Math.min(...values).toFixed(2),
          max: Math.max(...values).toFixed(2),
          trend: values.length > 7 ? 
            (values.slice(-7).reduce((sum, v) => sum + v, 0) / 7) > 
            (values.slice(0, 7).reduce((sum, v) => sum + v, 0) / 7) ? 'increasing' : 'decreasing' : 'stable'
        };
      }
    });

    const prompt = `You are a professional meteorologist writing a weather summary report. Create a comprehensive, natural weather summary based on this data:

LOCATION: ${location.lat}°N, ${location.lon}°E
DATA PERIOD: ${data.length} days of observations
CURRENT CONDITIONS: ${JSON.stringify(currentConditions, null, 2)}
STATISTICS: ${JSON.stringify(statistics, null, 2)}
ML FORECASTS: ${JSON.stringify(forecasts, null, 2)}

Write a professional weather summary that includes:
1. Current weather situation overview
2. Recent trends and patterns observed
3. Key highlights from the data period
4. Future predictions based on ML forecasts
5. Practical insights and recommendations for users
6. Any notable weather events or patterns

Write in a conversational, engaging style like a TV weather report. Use natural language, avoid technical jargon, and make it informative yet accessible. Include specific numbers but present them naturally. Focus on what this means for people's daily activities.

Keep the summary between 200-400 words.`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    res.json({ summary });
  } catch (error) {
    console.error('Gemini Summary Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate Gemini summary',
      message: error.message 
    });
  }
});

// Chat endpoint for Gemini AI
app.post('/api/chat', async (req, res) => {
  try {
    const { question, context } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a NASA Weather Assistant AI. Answer the user's question about weather data naturally and conversationally.

CONTEXT:
- Location: ${context.location.lat}°, ${context.location.lon}°
- Parameters: ${context.parameters.join(', ')}
- Data Points: ${context.dataPoints} days
- Statistics: ${JSON.stringify(context.statistics, null, 2)}
- AI Insights: ${context.insights}
- Recent Data: ${JSON.stringify(context.weatherData.slice(-3), null, 2)}

USER QUESTION: ${question}

Provide a helpful, natural response about the weather data. Use emojis and be conversational. Keep responses concise but informative. If asked about forecasts, mention the ML predictions with confidence levels.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    res.json({ response });
  } catch (error) {
    console.error('Gemini Chat Error:', error);
    res.status(500).json({ 
      response: "I'm having trouble connecting to my AI brain right now. Please try again later! 🤖" 
    });
  }
});

// NASA API proxy route
app.get('/api/nasa-proxy', async (req, res) => {
  try {
    const { parameters, longitude, latitude, start, end, format = 'JSON', community = 'AG' } = req.query;
    
    const nasaUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${parameters}&community=${community}&longitude=${longitude}&latitude=${latitude}&start=${start}&end=${end}&format=${format}`;
    
    const response = await axios.get(nasaUrl);
    res.json(response.data);
  } catch (error) {
    console.error('NASA API Error:', error.message);
    console.error('NASA API Error object:', error);
    res.status(500).json({ error: 'Failed to fetch NASA data' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
