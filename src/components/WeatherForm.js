import React, { useState } from 'react';
import axios from 'axios';
import LocationMap from './LocationMap';

const paramOptions = {
  "T2M": "Temperature (2m above ground)",
  "PRECTOTCORR": "Total Precipitation",
  "WS2M": "Wind Speed (2m above ground)",
  "RH2M": "Relative Humidity (2m above ground)",
  "SNODP": "Snow Depth"
};

const WeatherForm = ({ onFetch, loading }) => {
  const [locationMethod, setLocationMethod] = useState("manual");
  const [lat, setLat] = useState(28.6);
  const [lon, setLon] = useState(77.2);
  const [city, setCity] = useState("New Delhi");
  const [temporal, setTemporal] = useState("daily");
  const [startDate, setStartDate] = useState('2024-08-01');
  const [endDate, setEndDate] = useState('2024-08-31');
  const [startMonth, setStartMonth] = useState("202408");
  const [endMonth, setEndMonth] = useState("202408");
  const [selectedParams, setSelectedParams] = useState(["T2M", "PRECTOTCORR", "WS2M"]);
  const [error, setError] = useState('');

  const handleParamChange = (param) => {
    setSelectedParams(prev => 
      prev.includes(param) ? prev.filter(p => p !== param) : [...prev, param]
    );
  };

  const handleMapLocationSelect = (newLat, newLng) => {
    setLat(newLat);
    setLon(newLng);
    setLocationMethod('manual');
  };

  const handleCitySearch = async () => {
    if (!city) return;
    try {
      const response = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`);
      if (response.data.results && response.data.results.length > 0) {
        const { latitude, longitude } = response.data.results[0];
        // Animate to new location
        setTimeout(() => {
          setLat(latitude);
          setLon(longitude);
        }, 100);
        setError('');
      } else {
        setError(" City not found in our galactic database.");
      }
    } catch (err) {
      setError(" Failed to fetch city coordinates from space.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedParams.length === 0) {
      setError(" Please select at least one weather variable for your space mission.");
      return;
    }
    
    let start, end;
    if (temporal === 'daily') {
      start = startDate.replace(/-/g, '');
      end = endDate.replace(/-/g, '');
    } else {
      start = startMonth;
      end = endMonth;
    }

    onFetch({
      lat,
      lon,
      start,
      end,
      temporal,
      parameters: selectedParams.join(',')
    });
  };

  return (
    <div className="form-container">
      <h2 style={{color: '#fff', fontFamily: 'Orbitron, monospace', textAlign: 'center', marginBottom: '25px'}}>
         Mission Control Panel 
      </h2>
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-section" style={{marginBottom: '25px'}}>
          <h4 style={{color: '#ffd23f', fontFamily: 'Orbitron, monospace', marginBottom: '15px'}}>
             Target Location
          </h4>
          <div className="radio-group" style={{display: 'flex', gap: '20px', marginBottom: '15px'}}>
            <label style={{color: '#fff', display: 'flex', alignItems: 'center', gap: '8px'}}>
              <input 
                type="radio" 
                value="manual" 
                checked={locationMethod === 'manual'} 
                onChange={() => setLocationMethod('manual')}
                style={{accentColor: '#ff6b35'}}
              /> 📍 Manual Coordinates
            </label>
            <label style={{color: '#fff', display: 'flex', alignItems: 'center', gap: '8px'}}>
              <input 
                type="radio" 
                value="city" 
                checked={locationMethod === 'city'} 
                onChange={() => setLocationMethod('city')}
                style={{accentColor: '#ff6b35'}}
              />  Search by City
            </label>
          </div>

          {locationMethod === 'manual' && (
            <div className="form-row">
              <div className="form-group">
                <label> Latitude</label>
                <input type="number" step="0.1" value={lat} onChange={(e) => setLat(parseFloat(e.target.value))} />
              </div>
              <div className="form-group">
                <label> Longitude</label>
                <input type="number" step="0.1" value={lon} onChange={(e) => setLon(parseFloat(e.target.value))} />
              </div>
            </div>
          )}

          {locationMethod === 'city' && (
            <div className="form-row">
              <div className="form-group">
                <label> City Name</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <button type="button" className="btn" onClick={handleCitySearch}>
                🔍 Scan Galaxy
              </button>
            </div>
          )}

          <div style={{marginTop: '20px'}}>
            <h5 style={{color: '#ffd23f', fontFamily: 'Orbitron, monospace', marginBottom: '10px'}}>
               Interactive Mission Map
            </h5>
            <p style={{color: '#ccc', fontSize: '0.9rem', marginBottom: '10px'}}>
              Click anywhere on the map to set your data collection point
            </p>
            <LocationMap 
              lat={lat} 
              lon={lon} 
              onLocationSelect={handleMapLocationSelect}
            />
          </div>
        </div>

        <div className="form-section" style={{marginBottom: '25px'}}>
          <h4 style={{color: '#ffd23f', fontFamily: 'Orbitron, monospace', marginBottom: '15px'}}>
             Time Dimension
          </h4>
          <div className="form-group">
            <label> Temporal Resolution</label>
            <select value={temporal} onChange={(e) => setTemporal(e.target.value)}>
              <option value="daily">Daily Scans</option>
              <option value="monthly">Monthly Reports</option>
            </select>
          </div>
          {temporal === 'daily' ? (
            <div className="form-row">
              <div className="form-group">
                <label> Mission Start</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label> Mission End</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="form-row">
              <div className="form-group">
                <label> Start (YYYYMM)</label>
                <input type="text" value={startMonth} onChange={(e) => setStartMonth(e.target.value)} />
              </div>
              <div className="form-group">
                <label> End (YYYYMM)</label>
                <input type="text" value={endMonth} onChange={(e) => setEndMonth(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        <div className="form-section" style={{marginBottom: '25px'}}>
          <h4 style={{color: '#ffd23f', fontFamily: 'Orbitron, monospace', marginBottom: '15px'}}>
             Atmospheric Parameters
          </h4>
          <div className="param-checkboxes" style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px'}}>
            {Object.entries(paramOptions).map(([code, name]) => (
              <label key={code} style={{
                color: '#fff', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                padding: '8px',
                borderRadius: '8px',
                background: selectedParams.includes(code) ? 'rgba(255, 107, 53, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: selectedParams.includes(code) ? '1px solid rgba(255, 107, 53, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}>
                <input 
                  type="checkbox" 
                  checked={selectedParams.includes(code)} 
                  onChange={() => handleParamChange(code)}
                  style={{accentColor: '#ff6b35'}}
                /> {name}
              </label>
            ))}
          </div>
        </div>
        
        <button type="submit" className="btn" disabled={loading} style={{width: '100%', fontSize: '1.1rem'}}>
          {loading ? ' Transmitting to NASA...' : ' Launch Data Mission'}
        </button>
      </form>
    </div>
  );
};

export default WeatherForm;