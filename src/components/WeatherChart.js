import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const WeatherChart = ({ data }) => {
  // Space-themed colors for historical data
  const colors = ['#ff6b35', '#ffd23f', '#74b9ff', '#fd79a8', '#a29bfe'];
  // Different colors for predictions
  const predictionColors = ['#e84393', '#00b894', '#fdcb6e', '#6c5ce7', '#fd79a8'];

  const allLabels = [...data.data.map(d => d.date), ...(data.forecasts[data.parameters[0]] || []).map(d => d.date)];
  const uniqueLabels = [...new Set(allLabels)].sort();

  const chartData = {
    labels: uniqueLabels.map(date => `${date.slice(4,6)}/${date.slice(6,8)}`),
    datasets: data.parameters.flatMap((param, index) => {
      const color = colors[index % colors.length];
      const predictionColor = predictionColors[index % predictionColors.length];
      const historicalData = data.data.map(row => row[param]);
      const forecastData = (data.forecasts[param] || []).map(row => row[param]);
      
      const fullHistoricalData = uniqueLabels.map(label => {
        const dataPoint = data.data.find(d => d.date === label);
        return dataPoint ? dataPoint[param] : null;
      });

      const fullForecastData = uniqueLabels.map(label => {
        const dataPoint = data.forecasts[param]?.find(d => d.date === label);
        return dataPoint ? dataPoint[param] : null;
      });

      const datasets = [{
        label: `${getParameterDisplayName(param)} (${data.units[param].units})`,
        data: fullHistoricalData,
        borderColor: color,
        backgroundColor: color + '30',
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 8,
      }];

      if (forecastData.length > 0) {
        datasets.push({
          label: ` ${getParameterDisplayName(param)} (ML Forecast)`,
          data: fullForecastData,
          borderColor: predictionColor,
          borderDash: [10, 5],
          backgroundColor: predictionColor + '20',
          tension: 0.3,
          borderWidth: 3,
          pointBackgroundColor: predictionColor,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointStyle: 'triangle',
        });

        // Add confidence interval if available
        const confidenceData = data.forecasts[param]?.map(row => row.confidence);
        if (confidenceData && confidenceData.length > 0) {
          const upperBound = uniqueLabels.map(label => {
            const dataPoint = data.forecasts[param]?.find(d => d.date === label);
            if (dataPoint) {
              const margin = dataPoint[param] * (1 - dataPoint.confidence) * 0.5;
              return dataPoint[param] + margin;
            }
            return null;
          });

          const lowerBound = uniqueLabels.map(label => {
            const dataPoint = data.forecasts[param]?.find(d => d.date === label);
            if (dataPoint) {
              const margin = dataPoint[param] * (1 - dataPoint.confidence) * 0.5;
              return dataPoint[param] - margin;
            }
            return null;
          });

          datasets.push({
            label: ` ${getParameterDisplayName(param)} (Confidence Band)`,
            data: upperBound,
            borderColor: predictionColor + '40',
            backgroundColor: predictionColor + '10',
            fill: '+1',
            tension: 0.3,
            borderWidth: 1,
            pointRadius: 0,
            pointHoverRadius: 0,
          });

          datasets.push({
            label: `${getParameterDisplayName(param)} (Lower Bound)`,
            data: lowerBound,
            borderColor: predictionColor + '40',
            backgroundColor: predictionColor + '10',
            fill: false,
            tension: 0.3,
            borderWidth: 1,
            pointRadius: 0,
            pointHoverRadius: 0,
          });
        }
      }

      return datasets;
    })
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#fff',
          font: {
            family: 'Space Mono, monospace',
            size: 12
          },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: {
        display: true,
        text: '📈 Temporal Data Visualization 🛰️',
        color: '#fff',
        font: {
          family: 'Orbitron, monospace',
          size: 18,
          weight: 'bold'
        },
        padding: 20
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffd23f',
        bodyColor: '#fff',
        borderColor: '#ff6b35',
        borderWidth: 1,
        titleFont: {
          family: 'Orbitron, monospace'
        },
        bodyFont: {
          family: 'Space Mono, monospace'
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          borderColor: 'rgba(255, 255, 255, 0.3)'
        },
        ticks: {
          color: '#fff',
          font: {
            family: 'Space Mono, monospace'
          }
        }
      },
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          borderColor: 'rgba(255, 255, 255, 0.3)'
        },
        ticks: {
          color: '#fff',
          font: {
            family: 'Space Mono, monospace'
          }
        }
      }
    },
    elements: {
      point: {
        hoverBorderWidth: 3
      }
    }
  };

  return (
    <div className="chart-container">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        marginBottom: '20px'
      }}>
        {/* <span style={{fontSize: '1.5rem'}}></span> */}
        <h2 style={{
          color: '#fff',
          fontFamily: 'Orbitron, monospace',
          margin: 0,
          textAlign: 'center'
        }}>
          Mission Data Visualization
        </h2>
        {/* <span style={{fontSize: '1.5rem'}}></span> */}
      </div>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default WeatherChart;