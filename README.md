# Weather Now ☀️

A modern, responsive weather forecasting application that provides real-time weather data for any location worldwide.

## Features

- 🌍 Search for weather in any city
- 🔽 Select location dropdowns related to your input
- 📍 Auto-detects your current location
- 🌡️ Current weather conditions with feels-like temperature
- 📅 7-day weather forecast
- ⏰ 24-hour hourly forecast
- 🔄 Unit conversion (Celsius/Fahrenheit, km/h/mph, mm/inches)
- 📱 Fully responsive design
- 🎨 Modern, clean UI with smooth animations

## Technologies Used

- HTML5
- CSS3 (with custom properties and animations)
- Vanilla JavaScript (ES6+)
- [Open-Meteo API](https://open-meteo.com/) - Weather data
- [FreeIPAPI](https://freeipapi.com/) - Geolocation

## Installation

1. Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/weather-app.git
```

2. Navigate to the project directory:

```bash
cd weather-app
```

3. Open `index.html` in your browser or use a local server:

```bash
# Using Python
python -m http.server 8000

# Or using Node.js
npx serve
```

4. Visit `http://localhost:8000` in your browser

## Usage

1. The app automatically detects your location on first load
2. Use the search bar to find weather for any city
3. Select relevant locations as you type by clicking or moving "up" and "down" arrows on search dropdowns
4. Click the Units dropdown to change temperature, wind speed, or precipitation units
5. View daily forecast cards for the next 7 days
6. Select a day in the hourly forecast to see that day's weather by hour

## Project Structure

```
weather-app/
├── index.html           # Main HTML file
├── styles.css           # Main stylesheet
├── mediaqueries.css     # Responsive design styles
├── script.js            # JavaScript functionality
├── assets/
│   ├── fonts/          # Custom fonts
│   └── images/         # Weather icons and graphics
└── README.md           # Project documentation
```

## API Attribution

Weather data provided by [Open-Meteo.com](https://open-meteo.com/)

## Credits

- Challenge by [Frontend Mentor](https://www.frontendmentor.io)
- Coded by Ju-em Miles Corral

## License

This project is open source and available under the MIT License.
