import React from 'react';

const MLMetrics = ({ data }) => {
  if (!data || !data.forecasts) return null;

  const calculateMetrics = () => {
    const metrics = {};
    
    data.parameters.forEach(param => {
      const forecasts = data.forecasts[param];
      if (forecasts && forecasts.length > 0) {
        const avgConfidence = forecasts.reduce((sum, f) => sum + (f.confidence || 0), 0) / forecasts.length;
        const forecastRange = Math.max(...forecasts.map(f => f[param])) - Math.min(...forecasts.map(f => f[param]));
        
        metrics[param] = {
          confidence: avgConfidence,
          range: forecastRange,
          points: forecasts.length
        };
      }
    });
    
    return metrics;
  };

  const metrics = calculateMetrics();

  return (
    <div className="ml-metrics-container">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        marginBottom: '20px'
      }}>
        <h3 style={{
          color: '#fff',
          fontFamily: 'Orbitron, monospace',
          margin: 0,
          textAlign: 'center'
        }}>
          ML Model Performance
        </h3>
      </div>
      
      <div className="metrics-grid">
        {Object.entries(metrics).map(([param, metric]) => (
          <div key={param} className="metric-card">
            <h4 style={{
              color: '#ffd23f',
              fontFamily: 'Orbitron, monospace',
              fontSize: '0.9rem',
              margin: '0 0 15px 0',
              textTransform: 'uppercase'
            }}>
              {param}
            </h4>
            
            <div className="metric-row">
              <span className="metric-label">Confidence</span>
              <div className="confidence-bar">
                <div 
                  className="confidence-fill"
                  style={{
                    width: `${metric.confidence * 100}%`,
                    background: `linear-gradient(90deg, 
                      ${metric.confidence > 0.8 ? '#00b894' : 
                        metric.confidence > 0.6 ? '#fdcb6e' : '#e17055'}
                      0%, 
                      ${metric.confidence > 0.8 ? '#00a085' : 
                        metric.confidence > 0.6 ? '#e17055' : '#d63031'}
                      100%)`
                  }}
                />
              </div>
              <span className="metric-value">
                {(metric.confidence * 100).toFixed(1)}%
              </span>
            </div>
            
            <div className="metric-row">
              <span className="metric-label">Forecast Points</span>
              <span className="metric-value">{metric.points}</span>
            </div>
            
            <div className="metric-row">
              <span className="metric-label">Value Range</span>
              <span className="metric-value">{metric.range.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="model-info">
        <p style={{
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '0.8rem',
          textAlign: 'center',
          margin: '20px 0 0 0',
          fontFamily: 'Space Mono, monospace'
        }}>
          Using Ensemble ML: Moving Average + Exponential Smoothing
        </p>
      </div>
    </div>
  );
};

export default MLMetrics;
