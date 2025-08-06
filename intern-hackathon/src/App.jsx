import "./App.css";
import React, { useState } from "react";
import Dashboard from "./Dashboard.jsx";

function App() {
  const [userLocation, setUserLocation] = useState(null);

  const getUserLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        let { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        console.log(latitude);
        console.log(longitude);
      },
      (error) => {
        console.error("Error getting location:", error);
      }
    );
  };
  return <Dashboard />;
  // return (
  //   <div className="App">
  //     <header className="App-header">
  //       <h1>concert.io</h1>
  //     </header>
  //     <div className="App-body">
  //       <p>
  //         Edit <code>src/App.js</code> and save to reload.
  //       </p>
  //       <button onClick={getUserLocation}>Get User Location</button>
  //       {userLocation && (
  //         <div>
  //           <h2>User Location</h2>
  //           <p>Latitude: {userLocation.latitude}</p>
  //           <p>Longitude: {userLocation.longitude}</p>
  //         </div>
  //       )}
  //     </div>
  //     <footer className="App-foot">
  //       <p>presented by team SAND</p>
  //     </footer>
  //   </div>
  // );
}

export default App;
