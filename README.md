# Weather Now ☀️

A modern, responsive weather forecasting application that provides real-time weather data for any location worldwide.

## Features

- 🌍 Search for weather in any city with dropdown suggestions
- 📍 Auto-detects your current location
- 🌡️ Current weather conditions with feels-like temperature
- 📅 7-day weather forecast
- ⏰ 24-hour hourly forecast
- 🔄 Unit conversion (Celsius/Fahrenheit, km/h/mph, mm/inches)
- 📱 Fully responsive design

## Technologies Used

- HTML5, CSS3, Vanilla JavaScript
- [Open-Meteo API](https://open-meteo.com/) - Weather data
- Vercel Edge Functions - IP geolocation (solves CORS issues)

## Local Development

Install Vercel CLI:

```bash
npm install -g vercel
```

Run development server:

```bash
vercel dev
```

Visit: `http://localhost:3000`

> **Note:** Must use `vercel dev` (not other local servers) for geolocation to work.

## Deployment

```bash
vercel login
vercel --prod
```

## Credits

- Challenge by [Frontend Mentor](https://www.frontendmentor.io)
- Developed by Ju-em Miles Corral

## License

Copyright © 2026 Ju-em Miles Corral. All rights reserved.
