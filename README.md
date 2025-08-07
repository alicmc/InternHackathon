# 🎟️ concert.io

**A location-based concert discovery platform powered by Ticketmaster API**

_Developed by Team SAND for the Intern Hackathon_

## 🚀 Overview

concert.io is a modern React web application that helps users discover concerts and music events in their area. The platform integrates with the Ticketmaster API to provide real-time event data, featuring location-based search, interactive visualizations, and an intuitive dark/light theme interface.

## ✨ Features

### 🎵 Event Discovery

- **Location-based Search**: Automatically detects user location using geolocation API
- **Genre Filtering**: Filter events by predefined music genres (Pop, Rock, Hip-Hop, Jazz, etc.)
- **Artist Search**: Search for specific artists and their upcoming events
- **Smart Sorting**: Sort events by date or distance from user location

### 📊 Data Visualization

- **Top Artists Chart**: Interactive bar chart showing the most popular artists in your area
- **Responsive Design**: Charts adapt to different screen sizes using Recharts

### 🎨 User Experience

- **Dark/Light Mode**: Toggle between themes for comfortable viewing
- **Event Details Modal**: Click on any event to view detailed information including:
  - Venue information and location
  - Date and time formatting
  - High-quality event images
  - Direct ticket purchase links
- **CSV Export**: Export event data for external analysis

### 🌍 Location Features

- **Geohashing**: Efficient location encoding using ngeohash
- **Distance Calculation**: Haversine formula for accurate distance measurements
- **Radius Search**: Configurable search radius (default 200 miles)

## 🛠️ Technology Stack

### Frontend

- **React 19.1.1** - Modern React with latest features
- **Material-UI v7** - Comprehensive React component library
- **Recharts** - Composable charting library built on React components
- **Emotion** - CSS-in-JS library for styling

### Backend

- **Express.js** - Node.js web framework for API proxy server
- **Axios** - Promise-based HTTP client
- **CORS** - Cross-Origin Resource Sharing middleware

### Build & Development

- **CRACO** - Create React App Configuration Override
- **Webpack Polyfills** - Browser compatibility for Node.js modules

### APIs & Data

- **Ticketmaster Discovery API** - Event and venue data
- **Geolocation API** - Browser-native location services
- **File-Saver** - Client-side file generation

## 🏗️ Architecture

The application follows a client-server architecture:

1. **React Frontend** (`src/Dashboard.jsx`) - Main user interface
2. **Express Proxy Server** (`src/server/server.js`) - API intermediary to handle CORS and API keys
3. **Ticketmaster API** - External data source for events

## 📦 Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager
- Ticketmaster API key

### Environment Variables

Create a `.env` file in the `src/server/` directory:

```env
TICKETMASTER_API_KEY=your_ticketmaster_api_key_here
```

### Installation Steps

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd intern-hackathon
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   - Obtain a Ticketmaster API key from [Ticketmaster Developer Portal](https://developer.ticketmaster.com/)
   - Create `.env` file with your API key as shown above

4. **Start the development server**

   ```bash
   npm start
   ```

5. **Start the proxy server** (in a separate terminal)
   ```bash
   node src/server/server.js
   ```

The application will be available at `http://localhost:3000`

## 🚀 Available Scripts

### Development

- `npm start` - Runs the app in development mode with hot reloading
- `npm test` - Launches the test runner in interactive watch mode
- `npm run build` - Builds the app for production

### Production

The app includes Docker configuration for containerized deployment:

```bash
# Build Docker image
docker build -t concert-io .

# Run container
docker run -p 80:80 concert-io
```

## ☁️ Deployment

### Fly.io Deployment

The project is configured for deployment on Fly.io:

1. **Install Fly CLI**
2. **Configure secrets**
   ```bash
   flyctl secrets set TICKETMASTER_API_KEY=your_api_key
   ```
3. **Deploy**
   ```bash
   flyctl deploy
   ```

### CI/CD

Automated deployment is set up via GitHub Actions (`.github/workflows/fly.yml`) that triggers on pushes to the main branch.

## 🔧 Configuration

### Webpack Configuration (`craco.config.js`)

Custom webpack configuration provides Node.js polyfills for browser compatibility:

- HTTP/HTTPS modules
- OS utilities
- Buffer support

### API Endpoints

- `GET /api/events` - Fetch events with query parameters
- `GET /api/event/:id` - Fetch detailed event information

## 📱 Usage

1. **Grant Location Permission**: Allow the app to access your location for personalized results
2. **Search Events**: Use genre filters or artist search to find relevant events
3. **Sort Results**: Click column headers to sort by date or distance
4. **View Details**: Click on any event row to see detailed information
5. **Export Data**: Use the Export CSV button to download event data

## 🎯 Key Features Implementation

### Location-Based Search

```javascript
// Geolocation integration
navigator.geolocation.getCurrentPosition((position) => {
  setLocation({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  });
});

// Geohash encoding for efficient radius searches
geoPoint: Geohash.encode(location.latitude, location.longitude);
```

### Distance Calculation

```javascript
// Haversine formula implementation
const distance = haversine(
  { lat: userLocation.latitude, lon: userLocation.longitude },
  { lat: venueLatitude, lon: venueLongitude }
);
```

## 👥 Team SAND

This project was developed as part of an intern hackathon, showcasing modern web development practices and API integration skills.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project was created for educational purposes as part of an internship hackathon.

## 🙏 Acknowledgments

- Ticketmaster for providing the comprehensive events API
- Material-UI for the excellent React component library
- The React community for continuous innovation

---

**Live Demo**: [concert-io.fly.dev](https://concert-io.fly.dev)

**Built with ❤️ by Team SAND**
