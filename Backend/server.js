const http = require("http");
const https = require("https");
const mysql = require("mysql");
const fs = require("fs");
const cors = require("cors");
require("dotenv").config();

// MySQL connection
const db = mysql.createConnection({
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database,
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
  console.log("Connected to MySQL");
});

// OpenWeatherMap API configuration
const apiKey = process.env.weather_API_Key;

// Server setting
const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    res.writeHead(204); // No Content
    res.end();
    return;
  }

  if (req.url.startsWith("/fetchWeather") && req.method === "GET") {
    const urlParams = new URL(req.url, `http://${req.headers.host}`);

    const city = urlParams.searchParams.get("city");

    if (!city) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ error: "City parameter is required"})
      );
      return;
    }

    fetchWeatherData(city, (err, weatherData) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message,  statusCode: 0  }));
        return;
      }

      storeWeatherData(weatherData, (err, result) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Error storing weather data" }));
          return;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            message: "Weather data stored successfully",
            data: weatherData,
            statusCode: 1,
          })
        );
      });
    });
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

// Function to fetch weather data
function fetchWeatherData(city, callback) {
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

  https
    .get(apiUrl, (response) => {
      let data = "";

      // A chunk of data has been received.
      response.on("data", (chunk) => {
        data += chunk;
      });

      response.on("end", () => {
        if (response.statusCode === 200) {
          const weatherData = JSON.parse(data);
          const extractedData = {
            city: weatherData.name,
            temperature: weatherData.main.temp,
            humidity: weatherData.main.humidity,
          };
          console.log("extractedData", extractedData);
          callback(null, extractedData);
        } else {
          const weatherError = JSON.parse(data);
          const errorMessage = weatherError.message || "No city found";
          callback(new Error(`${errorMessage}`), null);
        }
      });
    })
    .on("error", (err) => {
      console.error("Error making API request:", err);
      callback(err, null);
    });
}

// Function to store weather data in MySQL
function storeWeatherData(data, callback) {
  const query =
    "INSERT INTO weather_logs (city, temperature, humidity) VALUES (?, ?, ?)";
  const values = [data.city, data.temperature, data.humidity];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Error inserting data into MySQL:", err);
      fs.appendFile("error.log", `Error: ${err.message}\n`, (fsErr) => {
        if (fsErr) console.error("Error writing to log file:", fsErr);
      });
      callback(err, null);
    } else {
      console.log("Weather data inserted:", result);
      callback(null, result);
    }
  });
}

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
