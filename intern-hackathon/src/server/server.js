const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors()); // Allow all origins (adjust if needed)

// Proxy endpoint to fetch events from Ticketmaster API
app.get("/api/events", async (req, res) => {
  try {
    const apiKey = process.env.TICKETMASTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "API key not configured" });
    }

    // Forward query parameters from frontend (like keyword, classificationName)
    const params = {
      apikey: apiKey,
      ...req.query,
    };

    const response = await axios.get(
      "https://app.ticketmaster.com/discovery/v2/events.json",
      { params }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching events:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
