import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion'; // npm install framer-motion

const WeatherSummary = ({ data }) => {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const generateLocalSummary = () => {
    if (!data || !data.data || data.data.length === 0) {
      return 'No weather data available for summary generation.';
    }
    const { data: weatherData, parameters, location, forecasts } = data;
    const paramNames = {
      "T2M": "temperature",
      "PRECTOTCORR": "precipitation", 
      "WS2M": "wind speed",
      "RH2M": "humidity",
      "SNODP": "snow depth"
    };

    // Data period
    const startDate = weatherData[0].date;
    const endDate = weatherData[weatherData.length - 1].date;
    const startFormatted = `${startDate.slice(6,8)}/${startDate.slice(4,6)}/${startDate.slice(0,4)}`;
    const endFormatted = `${endDate.slice(6,8)}/${endDate.slice(4,6)}/${endDate.slice(0,4)}`;
    
    let summary = `This weather analysis covers the period from ${startFormatted} to ${endFormatted} for the location at ${location.lat}°N, ${location.lon}°E.\n\n`;

    // Temperature analysis
    if (parameters.includes('T2M')) {
      const values = weatherData.map(d => d.T2M).filter(v => v !== null && !isNaN(v));
      if (values.length > 0) {
        const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        summary += `The temperature during this period has been quite ${avg > 25 ? 'warm' : avg > 15 ? 'moderate' : 'cool'}, averaging ${avg.toFixed(1)}°C. `;
        summary += `The warmest day reached ${max.toFixed(1)}°C, while the coolest dropped to ${min.toFixed(1)}°C. `;
        
        // Trend
        const recent = values.slice(-7);
        const earlier = values.slice(0, 7);
        if (recent.length > 0 && earlier.length > 0) {
          const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length;
          const earlierAvg = earlier.reduce((sum, v) => sum + v, 0) / earlier.length;
          if (recentAvg > earlierAvg + 1) {
            summary += `Recently, temperatures have been trending upward. `;
          } else if (recentAvg < earlierAvg - 1) {
            summary += `Recently, temperatures have been cooling down. `;
          } else {
            summary += `Temperature patterns have remained relatively stable. `;
          }
        }
        
        // Forecast
        if (forecasts && forecasts.T2M && forecasts.T2M.length > 0) {
          const forecastTemp = forecasts.T2M[0].T2M;
          const confidence = forecasts.T2M[0].confidence;
          summary += `Looking ahead, our ML model predicts temperatures around ${forecastTemp.toFixed(1)}°C with ${(confidence * 100).toFixed(0)}% confidence.\n\n`;
        } else {
          summary += `\n\n`;
        }
      }
    }

    // Precipitation analysis
    if (parameters.includes('PRECTOTCORR')) {
      const values = weatherData.map(d => d.PRECTOTCORR).filter(v => v !== null && !isNaN(v));
      if (values.length > 0) {
        const total = values.reduce((sum, v) => sum + v, 0);
        const avg = total / values.length;
        const rainyDays = values.filter(v => v > 0.1).length;
        const maxRain = Math.max(...values);
        if (total < 10) {
          summary += `This has been a relatively dry period with only ${total.toFixed(1)}mm of total rainfall. `;
        } else if (total < 50) {
          summary += `Rainfall has been moderate during this period, totaling ${total.toFixed(1)}mm. `;
        } else {
          summary += `This has been quite a wet period with ${total.toFixed(1)}mm of total precipitation. `;
        }
        summary += `There were ${rainyDays} days with measurable rainfall, `;
        if (maxRain > 20) {
          summary += `including one particularly heavy day with ${maxRain.toFixed(1)}mm. `;
        } else {
          summary += `with the heaviest day receiving ${maxRain.toFixed(1)}mm. `;
        }
        // Forecast
        if (forecasts && forecasts.PRECTOTCORR && forecasts.PRECTOTCORR.length > 0) {
          const forecastRain = forecasts.PRECTOTCORR[0].PRECTOTCORR;
          if (forecastRain > 5) {
            summary += `Rain is expected in the coming days. `;
          } else if (forecastRain > 0.1) {
            summary += `Light precipitation is possible in the forecast. `;
          } else {
            summary += `Dry conditions are expected to continue. `;
          }
        }
        summary += `\n\n`;
      }
    }

    // Wind analysis
    if (parameters.includes('WS2M')) {
      const values = weatherData.map(d => d.WS2M).filter(v => v !== null && !isNaN(v));
      if (values.length > 0) {
        const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
        const max = Math.max(...values);
        if (avg < 2) {
          summary += `Wind conditions have been generally calm, averaging ${avg.toFixed(1)} m/s. `;
        } else if (avg < 5) {
          summary += `There's been a light breeze throughout the period, with average wind speeds of ${avg.toFixed(1)} m/s. `;
        } else {
          summary += `It's been quite breezy, with average wind speeds reaching ${avg.toFixed(1)} m/s. `;
        }
        if (max > 10) {
          summary += `The windiest moment peaked at ${max.toFixed(1)} m/s. `;
        }
        summary += `\n\n`;
      }
    }

    // Overall assessment
    summary += `Overall, this location has experienced `;
    const tempAvg = parameters.includes('T2M') ? weatherData.map(d => d.T2M).filter(v => v !== null).reduce((sum, v) => sum + v, 0) / weatherData.filter(d => d.T2M !== null).length : null;
    const rainTotal = parameters.includes('PRECTOTCORR') ? weatherData.map(d => d.PRECTOTCORR).filter(v => v !== null).reduce((sum, v) => sum + v, 0) : null;
    if (tempAvg && tempAvg > 25 && rainTotal && rainTotal < 20) {
      summary += `warm and dry conditions, ideal for outdoor activities.`;
    } else if (tempAvg && tempAvg > 25 && rainTotal && rainTotal > 50) {
      summary += `warm and humid conditions with significant rainfall.`;
    } else if (tempAvg && tempAvg < 15 && rainTotal && rainTotal > 30) {
      summary += `cool and wet weather patterns.`;
    } else if (tempAvg && tempAvg < 15) {
      summary += `cooler weather conditions.`;
    } else {
      summary += `typical seasonal weather patterns for this geographic region.`;
    }

    return summary;
  };

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const response = await axios.post('http://localhost:3000/api/gemini-summary', {
          data: data.data,
          parameters: data.parameters,
          units: data.units,
          location: data.location,
          forecasts: data.forecasts
        });
        setSummary(response.data.summary);
      } catch (error) {
        setSummary(generateLocalSummary());
      } finally {
        setLoading(false);
      }
    };
    if (data) fetchSummary();
  }, [data]);

  return (
    <motion.div 
      className="chart-container"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 550,
        margin: '0 auto',
        padding: '1rem'
      }}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 18 }}
    >
      <motion.div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '15px',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}
        initial={{ scale: 0.85 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 130, damping: 10 }}
      >
        <motion.div whileHover={{ rotate: -17, scale: 1.15 }} style={{ fontSize: '2.3rem' }}>🌤️</motion.div>
        <h2 style={{
          color: '#fff',
          fontFamily: 'Orbitron, monospace',
          margin: 0,
          textAlign: 'center',
          fontSize: '2rem'
        }}>
          Weather Summary
        </h2>
        <motion.div whileHover={{ rotate: 13, scale: 1.15 }} style={{ fontSize: '2.3rem' }}>📝</motion.div>
      </motion.div>

      <motion.div
        whileHover={{
          y: -7,
          boxShadow: '0 7px 35px 0 #00808028'
        }}
        style={{
          background: 'rgba(255, 255, 255, 0.07)',
          border: '1.5px solid rgba(255, 255, 255, 0.13)',
          borderRadius: '18px',
          padding: '25px',
          backdropFilter: 'blur(7px)',
          marginBottom: '6px',
          minHeight: '110px',
          transition: 'background 0.2s'
        }}
      >
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              color: '#ffd23f',
              textAlign: 'center',
              fontStyle: 'italic',
              fontSize: '1.15rem',
              fontFamily: 'Orbitron, monospace'
            }}
          >
             Generating plain English summary...
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              color: '#fff',
              lineHeight: '1.8',
              fontSize: '1.08rem',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            {typeof summary === "string" && summary.length > 0 ? (
              summary.split('\n\n').map((paragraph, index) => (
                <p
                  key={index}
                  style={{
                    margin: '15px 0',
                    textAlign: 'justify'
                  }}>
                  {paragraph}
                </p>
              ))
            ) : (
              <p style={{ color: "#ffd23f", textAlign: "center" }}>
                No weather summary available.
              </p>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 600px) {
          .chart-container {
            padding: 0.5rem !important;
          }
          h2 {
            font-size: 1.1rem !important;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default WeatherSummary;
