import React, { useState } from "react";
import "./style.css"; 

const App = () => {
  const [city, setCity] = useState("");
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState("");

  const fetchWeather = async (cityName) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:3000/fetchWeather?city=${cityName}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        
        throw new Error(errorData.error || "Failed to fetch weather data");
      }
      const data = await response.json();
      setWeatherData(data?.data);
      setError(""); 
    } catch (err) {
      setWeatherData(null);
      setError(err.message || "Unable to fetch weather data. Please try again.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!city) {
      setError("Please enter a city name.");
      setWeatherData(null);
    } else {
      fetchWeather(city);
    }
  };

  return (
    <div className="App">
      <h1>Weather Search</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Enter city name"
        />
        <button type="submit">Search</button>
      </form>
      {error && <p className="error">{error}</p>}
      {weatherData && (
        <div className="weather-info">
          <h2>Weather in {weatherData.city}</h2>
          <p>Temperature: {weatherData.temperature}°C</p>
          <p>Humidity: {weatherData.humidity}%</p>
        </div>
      )}
    </div>
  );
};

export default App;
