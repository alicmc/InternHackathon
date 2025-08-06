import React, { useEffect, useState } from "react";
import axios from "axios";
import { saveAs } from "file-saver";
import {
  Button,
  Card,
  CardContent,
  TextField,
  Switch,
  FormControlLabel,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
const API_KEY = "YOUR_TICKETMASTER_API_KEY";
const API_URL = "https://app.ticketmaster.com/discovery/v2/events.json";
export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [genre, setGenre] = useState("");
  const [artist, setArtist] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL, {
        params: {
          apikey: API_KEY,
          keyword: artist,
          classificationName: genre,
        },
      });
      setEvents(response.data._embedded?.events || []);
    } catch (error) {
      console.error("Error fetching events", error);
    } finally {
      setLoading(false);
    }
  };
  const exportToCSV = () => {
    const headers = ["Name", "Date", "Venue", "City", "Genre", "Image URL"];
    const rows = events.map((event) => [
      event.name,
      event.dates?.start?.localDate,
      event._embedded?.venues?.[0]?.name,
      event._embedded?.venues?.[0]?.city?.name,
      event.classifications?.[0]?.genre?.name,
      event.images?.[0]?.url,
    ]);
    const csvContent = [headers, ...rows].map(e => e.map(v => `"${v || ""}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "events.csv");
  };
  const genreData = events.reduce((acc, event) => {
    const genreName = event.classifications?.[0]?.genre?.name || "Other";
    acc[genreName] = (acc[genreName] || 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(genreData).map(([name, count]) => ({ name, count }));
  return (
<div style={{ backgroundColor: darkMode ? "#121212" : "#f5f5f5", color: darkMode ? "#fff" : "#000", minHeight: "100vh", padding: "1rem" }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
<Typography variant="h4">🎟️ Ticketmaster Dashboard</Typography>
<FormControlLabel
          control={<Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} />}
          label="Dark Mode"
        />
</div>
<div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1rem" }}>
<TextField label="Filter by genre" value={genre} onChange={(e) => setGenre(e.target.value)} />
<TextField label="Search artist" value={artist} onChange={(e) => setArtist(e.target.value)} />
<Button variant="contained" onClick={fetchEvents}>Search</Button>
<Button variant="outlined" onClick={exportToCSV}>Export CSV</Button>
</div>
<Card style={{ marginTop: "2rem" }}>
<CardContent>
<Typography variant="h6" gutterBottom>Genre Distribution</Typography>
<ResponsiveContainer width="100%" height={300}>
<BarChart data={chartData} layout="vertical">
<XAxis type="number" stroke={darkMode ? "#fff" : "#000"} />
<YAxis type="category" dataKey="name" stroke={darkMode ? "#fff" : "#000"} />
<Tooltip />
<Bar dataKey="count" fill="#1976d2" />
</BarChart>
</ResponsiveContainer>
</CardContent>
</Card>
<Card style={{ marginTop: "2rem" }}>
<CardContent>
<Typography variant="h6" gutterBottom>Event List</Typography>
          {loading ? (
<CircularProgress />
          ) : (
<TableContainer component={Paper} style={{ marginTop: "1rem" }}>
<Table>
<TableHead>
<TableRow>
<TableCell>Name</TableCell>
<TableCell>Date</TableCell>
<TableCell>Venue</TableCell>
<TableCell>Image</TableCell>
</TableRow>
</TableHead>
<TableBody>
                  {events.map((event) => (
<TableRow key={event.id}>
<TableCell>{event.name}</TableCell>
<TableCell>{event.dates?.start?.localDate}</TableCell>
<TableCell>{event._embedded?.venues?.[0]?.name}</TableCell>
<TableCell>
<img src={event.images?.[0]?.url} alt={event.name} style={{ width: "80px", height: "48px", objectFit: "cover", borderRadius: "4px" }} />
</TableCell>
</TableRow>
                  ))}
</TableBody>
</Table>
</TableContainer>
          )}
</CardContent>
</Card>
</div>
  );
}