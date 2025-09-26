// Advanced Linear Regression with regularization
class LinearRegression {
  constructor(regularization = 0.01) {
    this.slope = 0;
    this.intercept = 0;
    this.regularization = regularization;
  }

  fit(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    // Add regularization to prevent overfitting
    const denominator = n * sumXX - sumX * sumX + this.regularization;
    this.slope = (n * sumXY - sumX * sumY) / denominator;
    this.intercept = (sumY - this.slope * sumX) / n;
  }

  predict(x) {
    return x.map(xi => this.slope * xi + this.intercept);
  }
}

// ARIMA-like model for better time series forecasting
class ARIMALite {
  constructor(p = 2, d = 1, q = 1) {
    this.p = p; // autoregressive order
    this.d = d; // differencing order
    this.q = q; // moving average order
    this.arCoeffs = [];
    this.maCoeffs = [];
  }

  difference(data, order = 1) {
    let result = [...data];
    for (let i = 0; i < order; i++) {
      result = result.slice(1).map((val, idx) => val - result[idx]);
    }
    return result;
  }

  fit(data) {
    // Simple AR model fitting
    const diffData = this.difference(data, this.d);
    const n = diffData.length;
    
    if (n < this.p + 1) return;

    // Fit AR coefficients using least squares
    const X = [];
    const y = [];
    
    for (let i = this.p; i < n; i++) {
      const row = [];
      for (let j = 1; j <= this.p; j++) {
        row.push(diffData[i - j]);
      }
      X.push(row);
      y.push(diffData[i]);
    }

    // Simple coefficient calculation
    this.arCoeffs = new Array(this.p).fill(0);
    for (let i = 0; i < this.p; i++) {
      let num = 0, den = 0;
      for (let j = 0; j < X.length; j++) {
        num += X[j][i] * y[j];
        den += X[j][i] * X[j][i];
      }
      this.arCoeffs[i] = den > 0 ? num / den : 0;
    }
  }

  forecast(data, steps) {
    this.fit(data);
    const diffData = this.difference(data, this.d);
    const forecasts = [];
    let current = [...diffData.slice(-this.p)];

    for (let i = 0; i < steps; i++) {
      let prediction = 0;
      for (let j = 0; j < this.p; j++) {
        prediction += this.arCoeffs[j] * current[current.length - 1 - j];
      }
      forecasts.push(prediction);
      current.push(prediction);
    }

    // Convert back from differenced data
    let lastValue = data[data.length - 1];
    return forecasts.map(diff => {
      lastValue += diff;
      return lastValue;
    });
  }
}

// Moving Average with Trend
class MovingAverageWithTrend {
  constructor(windowSize = 7) {
    this.windowSize = windowSize;
  }

  forecast(data, steps = 7) {
    if (data.length < this.windowSize) return [];

    // Calculate moving averages
    const movingAvgs = [];
    for (let i = this.windowSize - 1; i < data.length; i++) {
      const window = data.slice(i - this.windowSize + 1, i + 1);
      const avg = window.reduce((sum, val) => sum + val, 0) / this.windowSize;
      movingAvgs.push(avg);
    }

    // Calculate trend using linear regression on recent moving averages
    const recentAvgs = movingAvgs.slice(-Math.min(14, movingAvgs.length));
    const x = recentAvgs.map((_, i) => i);
    
    const lr = new LinearRegression();
    lr.fit(x, recentAvgs);

    // Generate forecasts
    const forecasts = [];
    const lastIndex = recentAvgs.length - 1;
    
    for (let i = 1; i <= steps; i++) {
      const trendValue = lr.slope * (lastIndex + i) + lr.intercept;
      forecasts.push(trendValue);
    }

    return forecasts;
  }
}

// Advanced Exponential Smoothing (Holt-Winters)
class HoltWinters {
  constructor(alpha = 0.3, beta = 0.1, gamma = 0.1, seasonLength = 7) {
    this.alpha = alpha; // level smoothing
    this.beta = beta;   // trend smoothing
    this.gamma = gamma; // seasonal smoothing
    this.seasonLength = seasonLength;
  }

  forecast(data, steps = 7) {
    if (data.length < this.seasonLength * 2) {
      return this.simpleExponentialSmoothing(data, steps);
    }

    const n = data.length;
    const level = new Array(n);
    const trend = new Array(n);
    const seasonal = new Array(n);

    // Initialize
    level[0] = data[0];
    trend[0] = (data[1] - data[0]);
    
    // Initialize seasonal components
    for (let i = 0; i < this.seasonLength; i++) {
      seasonal[i] = data[i] - level[0];
    }

    // Holt-Winters equations
    for (let i = 1; i < n; i++) {
      const seasonalIdx = i % this.seasonLength;
      
      level[i] = this.alpha * (data[i] - seasonal[seasonalIdx]) + 
                 (1 - this.alpha) * (level[i-1] + trend[i-1]);
      
      trend[i] = this.beta * (level[i] - level[i-1]) + 
                 (1 - this.beta) * trend[i-1];
      
      seasonal[i] = this.gamma * (data[i] - level[i]) + 
                    (1 - this.gamma) * seasonal[seasonalIdx];
    }

    // Generate forecasts
    const forecasts = [];
    for (let i = 1; i <= steps; i++) {
      const seasonalIdx = (n - 1 + i) % this.seasonLength;
      const forecast = level[n-1] + i * trend[n-1] + seasonal[seasonalIdx];
      forecasts.push(forecast);
    }

    return forecasts;
  }

  simpleExponentialSmoothing(data, steps) {
    let level = data[0];
    let trend = data.length > 1 ? data[1] - data[0] : 0;

    for (let i = 1; i < data.length; i++) {
      const prevLevel = level;
      level = this.alpha * data[i] + (1 - this.alpha) * (level + trend);
      trend = this.beta * (level - prevLevel) + (1 - this.beta) * trend;
    }

    return Array.from({length: steps}, (_, i) => level + (i + 1) * trend);
  }
}

// Enhanced ensemble forecasting with outlier detection
export class MLForecaster {
  constructor() {
    this.arimaModel = new ARIMALite(3, 1, 2);
    this.holtWinters = new HoltWinters(0.3, 0.1, 0.1, 7);
    this.maModel = new MovingAverageWithTrend(10);
  }

  preprocessData(values) {
    // Remove outliers using IQR method
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    // Replace outliers with median
    const median = sorted[Math.floor(sorted.length / 2)];
    return values.map(val => 
      val < lowerBound || val > upperBound ? median : val
    );
  }

  parseAIInsights(insights) {
    if (!insights || typeof insights !== 'string') return {};
    
    const patterns = {
      trend: /trend[ing]?\s+(up|down|increasing|decreasing|rising|falling|stable)/gi,
      seasonal: /seasonal|cycle|pattern|weekly|daily/gi,
      volatility: /volatile|unstable|fluctuat|variable|erratic/gi,
      correlation: /correlat|relationship|connect|influence/gi,
      forecast: /forecast|predict|expect|anticipat|likely/gi
    };

    const analysis = {
      trendDirection: 0, // -1 down, 0 stable, 1 up
      seasonality: false,
      volatility: 0, // 0-1 scale
      confidence: 0.5 // base confidence from AI
    };

    // Extract trend direction
    const trendMatches = insights.match(patterns.trend);
    if (trendMatches) {
      const trendText = trendMatches.join(' ').toLowerCase();
      if (trendText.includes('up') || trendText.includes('increasing') || trendText.includes('rising')) {
        analysis.trendDirection = 1;
      } else if (trendText.includes('down') || trendText.includes('decreasing') || trendText.includes('falling')) {
        analysis.trendDirection = -1;
      }
    }

    // Detect seasonality mentions
    analysis.seasonality = patterns.seasonal.test(insights);

    // Assess volatility mentions
    analysis.volatility = patterns.volatility.test(insights) ? 0.8 : 0.3;

    // Boost confidence if AI provides specific forecasts
    if (patterns.forecast.test(insights)) {
      analysis.confidence = 0.8;
    }

    return analysis;
  }

  generateForecast(data, column, forecastDays = 7, aiInsights = '') {
    if (!data || data.length < 14) return [];

    // Parse AI insights
    const aiAnalysis = this.parseAIInsights(aiInsights);

    // Extract and preprocess values
    let values = data
      .map(row => row[column])
      .filter(val => val !== null && val !== undefined && !isNaN(val));

    if (values.length < 14) return [];

    values = this.preprocessData(values);

    // Get forecasts from all models
    const arimaForecasts = this.arimaModel.forecast(values, forecastDays);
    const holtForecasts = this.holtWinters.forecast(values, forecastDays);
    const maForecasts = this.maModel.forecast(values, forecastDays);

    // Calculate data characteristics
    const recentTrend = this.calculateTrend(values.slice(-7));
    const volatility = this.calculateVolatility(values.slice(-14));
    
    // Adjust weights based on AI insights and data characteristics
    let arimaWeight = 0.4;
    let holtWeight = 0.4;
    let maWeight = 0.2;

    // AI-driven weight adjustments
    if (aiAnalysis.seasonality) {
      holtWeight += 0.2; // Boost Holt-Winters for seasonal patterns
      arimaWeight -= 0.1;
      maWeight -= 0.1;
    }

    if (Math.abs(aiAnalysis.trendDirection) > 0) {
      arimaWeight += 0.15; // Boost ARIMA for strong trends
      holtWeight -= 0.1;
      maWeight -= 0.05;
    }

    if (aiAnalysis.volatility > 0.6) {
      maWeight += 0.15; // Boost MA for high volatility
      arimaWeight -= 0.1;
      holtWeight -= 0.05;
    }

    // Normalize weights
    const totalWeight = arimaWeight + holtWeight + maWeight;
    arimaWeight /= totalWeight;
    holtWeight /= totalWeight;
    maWeight /= totalWeight;

    // Generate ensemble forecasts with AI bias
    const ensembleForecasts = arimaForecasts.map((arima, i) => {
      const holt = holtForecasts[i] || arima;
      const ma = maForecasts[i] || arima;
      let forecast = arimaWeight * arima + holtWeight * holt + maWeight * ma;

      // Apply AI trend bias
      if (aiAnalysis.trendDirection !== 0) {
        const trendAdjustment = aiAnalysis.trendDirection * volatility * 0.1 * (i + 1);
        forecast += trendAdjustment;
      }

      return forecast;
    });

    // Generate forecast data points
    const lastDateStr = data[data.length - 1].date;
    const lastDate = new Date(
      lastDateStr.slice(0, 4),
      lastDateStr.slice(4, 6) - 1,
      lastDateStr.slice(6, 8)
    );

    return ensembleForecasts.map((value, i) => {
      const nextDate = new Date(lastDate);
      nextDate.setDate(lastDate.getDate() + i + 1);
      return {
        date: nextDate.toISOString().split('T')[0].replace(/-/g, ''),
        [column]: Math.round(value * 1000) / 1000,
        confidence: this.calculateAIEnhancedConfidence(values, i, volatility, aiAnalysis)
      };
    });
  }

  calculateAIEnhancedConfidence(values, forecastIndex, volatility, aiAnalysis) {
    const recentValues = values.slice(-21);
    const mean = this.calculateMean(recentValues);
    const cv = volatility / Math.abs(mean);
    
    // Base confidence with AI boost
    const baseConfidence = 0.98;
    const aiConfidenceBoost = (aiAnalysis.confidence - 0.5) * 0.2;
    const distancePenalty = forecastIndex * 0.03;
    const volatilityPenalty = Math.min(cv, 0.4);
    const dataQualityBonus = Math.min(values.length / 30, 0.1);
    
    // Additional AI-based adjustments
    let aiAdjustment = 0;
    if (aiAnalysis.seasonality) aiAdjustment += 0.05;
    if (Math.abs(aiAnalysis.trendDirection) > 0) aiAdjustment += 0.03;
    
    return Math.max(0.4, baseConfidence + aiConfidenceBoost - distancePenalty - volatilityPenalty + dataQualityBonus + aiAdjustment);
  }

  calculateTrend(values) {
    if (values.length < 2) return 0;
    const x = values.map((_, i) => i);
    const lr = new LinearRegression();
    lr.fit(x, values);
    return lr.slope;
  }

  calculateVolatility(values) {
    const mean = this.calculateMean(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  calculateMean(values) {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  calculateAdvancedConfidence(values, forecastIndex, volatility) {
    const recentValues = values.slice(-21);
    const mean = this.calculateMean(recentValues);
    const cv = volatility / Math.abs(mean); // coefficient of variation
    
    // Base confidence starts higher and decreases more gradually
    const baseConfidence = 0.98;
    const distancePenalty = forecastIndex * 0.03;
    const volatilityPenalty = Math.min(cv, 0.4);
    const dataQualityBonus = Math.min(values.length / 30, 0.1);
    
    return Math.max(0.4, baseConfidence - distancePenalty - volatilityPenalty + dataQualityBonus);
  }

  // Calculate forecast accuracy metrics
  calculateAccuracy(actual, predicted) {
    if (actual.length !== predicted.length || actual.length === 0) return null;

    const mse = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0) / actual.length;
    const mae = actual.reduce((sum, val, i) => sum + Math.abs(val - predicted[i]), 0) / actual.length;
    const rmse = Math.sqrt(mse);
    
    const actualMean = actual.reduce((sum, val) => sum + val, 0) / actual.length;
    const mape = actual.reduce((sum, val, i) => {
      return sum + Math.abs((val - predicted[i]) / val);
    }, 0) / actual.length * 100;

    return { mse, mae, rmse, mape };
  }
}
