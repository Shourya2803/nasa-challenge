# NASA Weather App

A React web application for visualizing NASA POWER weather data.

## Features

- Fetch weather data from NASA POWER API
- Interactive charts using Chart.js
- Statistical summaries
- Responsive design
- Real-time data visualization

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Usage

1. Enter latitude and longitude coordinates
2. Set start and end dates (YYYYMMDD format)
3. Select weather parameters
4. Click "Get Weather Data" to fetch and visualize data

## Available Parameters

- T2M: Temperature at 2 meters (°C)
- PRECTOTCORR: Corrected total precipitation (mm)
- WS2M: Wind speed at 2 meters (m/s)
- RH2M: Relative humidity at 2 meters (%)

## Build

To create a production build:
```bash
npm run build
```
