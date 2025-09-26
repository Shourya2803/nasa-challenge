import React, { useState } from 'react';
import axios from 'axios';
import WeatherForm from './components/WeatherForm';
import WeatherChart from './components/WeatherChart';
import WeatherStats from './components/WeatherStats';
import GeminiInsights from './components/GeminiInsights';
import WeatherSummary from './components/WeatherSummary';
import ReportExport from './components/ReportExport';
import LocationComparison from './components/LocationComparison';
import MLMetrics from './components/MLMetrics';
import Chatbot from './components/Chatbot';
import { MLForecaster } from './services/mlForecasting';
import './App.css';

function App() {
  const [weatherData, setWeatherData] = useState(null);
  const [insights, setInsights] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('stats');
  const [mlForecaster] = useState(new MLForecaster());

  const handleFetch = async (formData) => {
    setLoading(true);
    setError('');
    setWeatherData(null);
    setInsights('');

    try {
      // 1. Fetch weather data from NASA via proxy
     const response = await axios.get(`/api/nasa-proxy`, {
  params: {
    parameters: formData.parameters,
    longitude: formData.lon,
    latitude: formData.lat,
    start: formData.start,
    end: formData.end,
    format: 'JSON'
  }
});


      if (response.data.properties && response.data.properties.parameter) {
        const paramData = response.data.properties.parameter;
        const dates = Object.keys(Object.values(paramData)[0]);
        
        const processedData = dates.map(date => {
          const row = { date };
          Object.keys(paramData).forEach(param => {
            row[param] = paramData[param][date] === -999 ? null : paramData[param][date];
          });
          return row;
        });

        // 2. Initial forecasts (will be updated after AI insights)
        let forecasts = {};
        const params = formData.parameters.split(',');
        if (formData.temporal === 'daily') {
          params.forEach(param => {
            forecasts[param] = mlForecaster.generateForecast(processedData, param, 7, '');
          });
        }

        const dataPayload = {
          data: processedData,
          parameters: params,
          forecasts,
          units: response.data.parameters,
          location: { lat: formData.lat, lon: formData.lon }
        };
        setWeatherData(dataPayload);

        // 3. Fetch AI insights and regenerate forecasts
        try {
          console.log('Fetching insights for:', dataPayload);
          const insightsResponse = await axios.post('http://localhost:3001/api/insights', dataPayload);
          console.log('Insights response:', insightsResponse.data);
          const aiInsights = insightsResponse.data.insights;
          setInsights(aiInsights);

          // Regenerate forecasts with AI insights
          if (formData.temporal === 'daily' && aiInsights) {
            const enhancedForecasts = {};
            params.forEach(param => {
              enhancedForecasts[param] = mlForecaster.generateForecast(processedData, param, 7, aiInsights);
              console.log(`AI-Enhanced ML Forecast for ${param}:`, enhancedForecasts[param]);
            });
            
            // Update weather data with enhanced forecasts
            setWeatherData(prev => ({
              ...prev,
              forecasts: enhancedForecasts
            }));
          }
        } catch (insightsError) {
          console.error('Insights error:', insightsError);
          setInsights('Could not load AI insights. Using standard ML forecasts.');
        }

      } else {
        setError(response.data.messages[0] || 'No data found for the selected criteria.');
      }
    } catch (err) {
      setError('Failed to fetch weather data. Please check your inputs and network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      {/* Sun */}
      <div className="sun">☀️</div>
      
      {/* Planet decorations */}
      <div className="planet-decoration planet-1"></div>
      <div className="planet-decoration planet-2"></div>
      
      {/* Floating satellites */}
      <div className="satellite satellite-1">🛰️</div>
      <div className="satellite satellite-2">📡</div>
      <div className="satellite satellite-3">🚀</div>
      
      {/* Floating planets */}
      <div className="floating-planet floating-planet-1">🪐</div>
      <div className="floating-planet floating-planet-2">🌍</div>
      <div className="floating-planet floating-planet-3">🌙</div>
      
      {/* Rocket launch */}
      <div className="rocket">🚀</div>
      
      <header className="App-header">
        <div className="space-header">
          <h1> NASA POWER Data Explorer </h1>
          <p style={{margin: '10px 0 0 0', fontSize: '1rem', opacity: 0.9}}>
            Powered by NASA POWER API & Gemini AI
          </p>
        </div>
      </header>
      <main>
        <div className="main-grid">
          <div className="content-section">
            <WeatherForm onFetch={handleFetch} loading={loading} />
            {loading && (
              <div className="loading">
                 Fetching data from space... 
              </div>
            )}
            {error && (
              <div className="error">
                 Houston, we have a problem: {error}
              </div>
            )}
            {weatherData && (
              <>
                <ReportExport data={weatherData} insights={insights} />
                
                <div className="tabs-container">
                  <button 
                    onClick={() => setActiveTab('stats')}
                    className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
                  >
                    {/* <span className="tab-icon">📊</span> */}
                    <span className="tab-text">Statistics</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('chart')}
                    className={`tab-button ${activeTab === 'chart' ? 'active' : ''}`}
                  >
                    {/* <span className="tab-icon">📈</span>  */}
                    <span className="tab-text">Charts</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('ml')}
                    className={`tab-button ${activeTab === 'ml' ? 'active' : ''}`}
                  >
                    {/* <span className="tab-icon">🤖</span> */}
                    <span className="tab-text">ML Forecast</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('compare')}
                    className={`tab-button ${activeTab === 'compare' ? 'active' : ''}`}
                  >
                    {/* <span className="tab-icon">🌍</span> */}
                    <span className="tab-text">Compare</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('summary')}
                    className={`tab-button ${activeTab === 'summary' ? 'active' : ''}`}
                  >
                    {/* <span className="tab-icon">🌤️</span> */}
                    <span className="tab-text">Summary</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('insights')}
                    className={`tab-button ${activeTab === 'insights' ? 'active' : ''}`}
                  >
                    {/* <span className="tab-icon">🧠</span> */}
                    <span className="tab-text">AI Analysis</span>
                  </button>
                </div>

                <div className="tab-content">
                  {activeTab === 'stats' && <WeatherStats data={weatherData} />}
                  {activeTab === 'chart' && <WeatherChart data={weatherData} />}
                  {activeTab === 'ml' && <MLMetrics data={weatherData} />}
                  {activeTab === 'compare' && <LocationComparison />}
                  {activeTab === 'summary' && <WeatherSummary data={weatherData} />}
                  {activeTab === 'insights' && <GeminiInsights insights={insights} />}
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Chatbot */}
        <Chatbot weatherData={weatherData} insights={insights} />
      </main>
    </div>
  );
}

export default App;