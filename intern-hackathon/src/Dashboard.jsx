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
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API_KEY = process.env.REACT_APP_TICKETMASTER_API_KEY;
const API_URL = "http://localhost:5000/api";
const PREDEFINED_GENRES = [
  "Pop",
  "Rock",
  "Rap",
  "Hip-Hop",
  "Electronic",
  "Jazz",
  "Country",
  "Classical",
  "Alternative",
];

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [genre, setGenre] = useState("");
  const [artist, setArtist] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchEvents = async () => {
    const delay = (ms) => new Promise((res) => setTimeout(res, ms));
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/events`, {
        params: {
          apikey: API_KEY,
          keyword: artist,
          classificationName: genre,
        },
      });

      const eventList = response.data._embedded?.events || [];

      const detailedEvents = [];
      for (const event of eventList) {
        try {
          const detailRes = await axios.get(
            `http://localhost:5000/api/event/${event.id}`
          );
          detailedEvents.push(detailRes.data);
        } catch (err) {
          console.warn(`Skipping event ${event.id}:`, err.message);
        }

        // Wait 250ms between requests to stay under 4 requests/sec
        await delay(250);
      }

      const artistNames = [
        ...new Set(
          detailedEvents
            .flatMap((e) => e._embedded?.attractions || [])
            .map((a) => a.name)
        ),
      ];

      const filteredByArtist = artist
        ? detailedEvents.filter((event) =>
            event._embedded?.attractions?.some((a) => a.name === artist)
          )
        : detailedEvents;

      const filteredByGenre = genre
        ? detailedEvents.filter(
            (event) =>
              event.classifications?.[0]?.genre?.name?.toLowerCase() ===
              genre.toLowerCase()
          )
        : detailedEvents;

      setEvents(filteredByGenre);
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

    const csvContent = [headers, ...rows]
      .map((e) => e.map((v) => `"${v || ""}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    saveAs(blob, "events.csv");
  };

  const genreData = events.reduce((acc, event) => {
    const genreName = event.classifications?.[0]?.genre?.name || "Other";
    acc[genreName] = (acc[genreName] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(genreData).map(([name, count]) => ({
    name,
    count,
  }));

  return (
    <div
      style={{
        backgroundColor: darkMode ? "#121212" : "#f5f5f5",
        color: darkMode ? "#fff" : "#000",
        minHeight: "100vh",
        padding: "1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h4">🎟️ Ticketmaster Dashboard</Typography>
        <FormControlLabel
          control={
            <Switch
              checked={darkMode}
              onChange={() => setDarkMode(!darkMode)}
            />
          }
          label="Dark Mode"
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          marginTop: "1rem",
        }}
      >
        <TextField
          select
          label="Select Genre"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          style={{ minWidth: 200 }}
        >
          <MenuItem value="">All</MenuItem>
          {PREDEFINED_GENRES.map((g) => (
            <MenuItem key={g} value={g}>
              {g}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Search artist"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
        />
        <Button variant="contained" onClick={fetchEvents}>
          Search
        </Button>
        <Button variant="outlined" onClick={exportToCSV}>
          Export CSV
        </Button>
      </div>

      <Card style={{ marginTop: "2rem" }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Genre Distribution
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical" barCategoryGap={10}>
              <XAxis
                type="number"
                allowDecimals={false}
                stroke={darkMode ? "#fff" : "#000"}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke={darkMode ? "#fff" : "#000"}
              />
              <Tooltip />
              <Bar dataKey="count" fill="#1976d2" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card style={{ marginTop: "2rem" }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Event List
          </Typography>
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
                    <TableRow
                      key={event.id}
                      hover
                      onClick={() => setSelectedEvent(event)}
                      style={{ cursor: "pointer" }}
                    >
                      <TableCell>{event.name}</TableCell>
                      <TableCell>{event.dates?.start?.localDate}</TableCell>
                      <TableCell>
                        {event._embedded?.venues?.[0]?.name}
                      </TableCell>
                      <TableCell>
                        <img
                          src={event.images?.[0]?.url}
                          alt={event.name}
                          style={{
                            width: "80px",
                            height: "48px",
                            objectFit: "cover",
                            borderRadius: "4px",
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
      <Dialog
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{selectedEvent?.name}</DialogTitle>
        <DialogContent>
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
            <img
              src={selectedEvent?.images?.[0]?.url}
              alt={selectedEvent?.name}
              style={{
                width: "120px",
                height: "80px",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />
            <div>
              <Typography variant="subtitle1">
                <strong>Venue:</strong>{" "}
                {selectedEvent?._embedded?.venues?.[0]?.name}
              </Typography>
              <Typography variant="subtitle2">
                <strong>Location:</strong>{" "}
                {selectedEvent?._embedded?.venues?.[0]?.city?.name},{" "}
                {selectedEvent?._embedded?.venues?.[0]?.state?.name}
              </Typography>
              <Typography variant="subtitle2">
                <strong>Date & Time:</strong>{" "}
                {(() => {
                  const date = selectedEvent?.dates?.start?.localDate;
                  const time = selectedEvent?.dates?.start?.localTime;
                  if (!date || !time) return "N/A";
                  const formatted = new Date(`${date}T${time}`).toLocaleString(
                    "en-US",
                    {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                      hour12: true,
                    }
                  );
                  return formatted;
                })()}
              </Typography>
            </div>
          </div>
          <Button
            variant="contained"
            color="primary"
            href={selectedEvent?.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Buy Tickets
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedEvent(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
