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
  CssBaseline,
  Container,
  Autocomplete
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API_KEY = process.env.REACT_APP_TICKETMASTER_API_KEY;
const API_URL = "https://app.ticketmaster.com/discovery/v2/events.json";
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
  const [artistInput, setArtistInput] = useState("");
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [artistOptions, setArtistOptions] = useState([]);

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
    },
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL, {
        params: {
          apikey: API_KEY,
          keyword: artistInput,
          classificationName: genre,
        },
      });

      const eventList = response.data._embedded?.events || [];

      const detailedEvents = await Promise.all(
        eventList.map(async (event) => {
          try {
            const detailRes = await axios.get(
              `https://app.ticketmaster.com/discovery/v2/events/${event.id}.json`,
              { params: { apikey: API_KEY } }
            );
            return detailRes.data;
          } catch {
            return event;
          }
        })
      );

      const artistNames = [
        ...new Set(
          detailedEvents
            .flatMap((e) => e._embedded?.attractions || [])
            .map((a) => a.name)
        ),
      ];

      setArtistOptions(artistNames);

      const filteredByArtist = selectedArtist
        ? detailedEvents.filter((event) =>
            event._embedded?.attractions?.some(
              (a) => a.name === selectedArtist
            )
          )
        : detailedEvents;

      const filteredByGenre = genre
        ? filteredByArtist.filter(
            (event) =>
              event.classifications?.[0]?.genre?.name?.toLowerCase() ===
              genre.toLowerCase()
          )
        : filteredByArtist;

      setEvents(filteredByGenre);
    } catch (error) {
      console.error("Error fetching events", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Name",
      "Date",
      "Venue",
      "City",
      "Genre",
      "Image URL",
    ];
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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h4">🎟️ Ticketmaster Dashboard</Typography>
          <FormControlLabel
            control={<Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} />}
            label="Dark Mode"
          />
        </div>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1rem" }}>
          <TextField
            select
            label="Select Genre"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            style={{ minWidth: 200 }}
          >
            <MenuItem value="">All</MenuItem>
            {PREDEFINED_GENRES.map((g) => (
              <MenuItem key={g} value={g}>{g}</MenuItem>
            ))}
          </TextField>

          <TextField
            label="Search artist"
            value={artistInput}
            onChange={(e) => setArtistInput(e.target.value)}
          />

          <Autocomplete
            options={artistOptions}
            value={selectedArtist}
            onChange={(_, value) => setSelectedArtist(value)}
            renderInput={(params) => (
              <TextField {...params} label="Select Artist" />
            )}
            style={{ minWidth: 200 }}
          />

          <Button variant="contained" onClick={fetchEvents}>Search</Button>
          <Button variant="outlined" onClick={exportToCSV}>Export CSV</Button>
        </div>

        {/* ...existing JSX remains unchanged... */}

      </Container>
    </ThemeProvider>
  );
}
