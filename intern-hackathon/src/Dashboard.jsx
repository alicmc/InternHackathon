import React, { useEffect, useState } from "react";
import Geohash from "ngeohash";
import axios from "axios";
import { saveAs } from "file-saver";
import haversine from "haversine-distance";
import { styled } from "@mui/material/styles";
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
  Pagination,
  Box,
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
  const [sortedEvents, setSortedEvents] = useState([]);
  const [genre, setGenre] = useState("");
  const [artist, setArtist] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [location, setLocation] = useState({
    latitude: 38.9072,
    longitude: 77.0369,
  });
  const [sortOrder, setSortOrder] = useState("asc"); // or "desc"
  const [sortBy, setSortBy] = useState(null); // e.g., "date" or "distance"
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(10); // Number of events per page

  useEffect(() => {
    // Prompt for geolocation on mount
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          console.log("User location:", position.coords);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    } else {
      console.warn("Geolocation not supported");
    }
  }, []);

  const StyledCard = styled(Card)(({ theme, darkMode }) => ({
    backgroundColor: darkMode ? "#1e1e1e" : "#fff",
    color: darkMode ? "#fff" : "#000",
    margin: "2rem",
    padding: "1rem",
    borderRadius: "8px",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
  }));

  const sortEventsByDate = (order) => {
    const sorted = [...events].sort((a, b) => {
      const dateA = new Date(a.dates?.start?.localDate);
      const dateB = new Date(b.dates?.start?.localDate);
      return order === "asc" ? dateA - dateB : dateB - dateA;
    });
    setSortedEvents(sorted);
    setCurrentPage(1); // Reset to first page when sorting
  };

  const sortEventsByDistance = (order) => {
    if (!location) return;

    const sorted = [...events].sort((a, b) => {
      const venueA = a._embedded?.venues?.[0]?.location;
      const venueB = b._embedded?.venues?.[0]?.location;

      if (!venueA || !venueB) return 0;

      const distA = haversine(
        { lat: location.latitude, lon: location.longitude },
        { lat: parseFloat(venueA.latitude), lon: parseFloat(venueA.longitude) }
      );

      const distB = haversine(
        { lat: location.latitude, lon: location.longitude },
        { lat: parseFloat(venueB.latitude), lon: parseFloat(venueB.longitude) }
      );

      return order === "asc" ? distA - distB : distB - distA;
    });

    setSortedEvents(sorted);
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Pagination logic
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = sortedEvents.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(sortedEvents.length / eventsPerPage);

  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage);
  };

  const fetchEvents = async () => {
    const delay = (ms) => new Promise((res) => setTimeout(res, ms));
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/events`, {
        params: {
          apikey: API_KEY,
          keyword: artist,
          classificationName: genre,
          segmentName: "Music",
          geoPoint: Geohash.encode(location.latitude, location.longitude),
          radius: 200, // e.g., 25 miles
          unit: "miles", // or "km"
          size: 100,
        },
      });

      const eventList = response.data._embedded?.events || [];

      const detailedEvents = [];
      for (const event of eventList) {
        try {
          const detailRes = await axios.get(`${API_URL}/event/${event.id}`);
          detailedEvents.push(detailRes.data);
        } catch (err) {
          console.warn(`Skipping event ${event.id}:`, err.message);
        }

        // Wait 200ms between requests to stay under 5 requests/sec
        await delay(200);
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
      setSortedEvents(filteredByGenre);
      setCurrentPage(1); // Reset to first page when new events are loaded
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

  const artistData = events.reduce((acc, event) => {
    // Use first attraction's name if available for better accuracy
    const artistName = event._embedded?.attractions?.[0]?.name || "Other";
    acc[artistName] = (acc[artistName] || 0) + 1;
    return acc;
  }, {});

  // Convert object to array and sort by count desc
  const sortedArtists = Object.entries(artistData)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 10); // Keep top 10 only

  const chartData = sortedArtists.map(([name, count]) => ({
    name,
    count,
  }));

  return (
    <div className={darkMode ? "App-dark" : "App"}>
      <header className={darkMode ? "App-header-dark" : "App-header"}>
        <Typography variant="h4">🎟️ concert.io</Typography>
        <FormControlLabel
          control={
            <Switch
              checked={darkMode}
              onChange={() => setDarkMode(!darkMode)}
            />
          }
          label="Dark Mode"
        />
      </header>

      <div className={`App-body ${darkMode ? "dark" : "light"}`}>
        <TextField
          className="Text-field"
          select
          label="Select Genre"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          sx={{ minWidth: "200px", color: darkMode ? "#fff" : "#000" }}
        >
          <MenuItem value="">All</MenuItem>
          {PREDEFINED_GENRES.map((g) => (
            <MenuItem key={g} value={g}>
              {g}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          className="Text-field"
          label="Search artist"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          sx={{ minWidth: "200px", color: darkMode ? "#fff" : "#000" }}
        />
        <Button variant="contained" onClick={fetchEvents}>
          Search
        </Button>
        <Button variant="outlined" onClick={exportToCSV}>
          Export CSV
        </Button>
      </div>

      <StyledCard darkMode={darkMode}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Top Artists in Your Area
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              layout="vertical"
              barCategoryGap={20}
              margin={{ left: 20, right: 20, top: 20, bottom: 20 }}
            >
              <XAxis
                type="number"
                allowDecimals={false}
                stroke={darkMode ? "#fff" : "#000"}
              />
              <YAxis
                type="category"
                dataKey="name"
                interval={0} // ensures all labels show
                tick={{ fontSize: 12 }} // smaller font
                width={160} // optional: explicit width for Y-axis labels
                stroke={darkMode ? "#fff" : "#000"}
              />
              <Tooltip />
              <Bar dataKey="count" fill="#9a4975ff" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </StyledCard>

      <StyledCard darkMode={darkMode}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Event List
          </Typography>
          {loading ? (
            <CircularProgress />
          ) : (
            <TableContainer
              component={Paper}
              sx={{
                "& .MuiTableCell-root": {
                  marginTop: "1rem",
                  backgroundColor: darkMode ? "#1e1e1e" : "#fff",
                  color: darkMode ? "#fff" : "#000",
                },
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell
                      onClick={() => {
                        const newOrder =
                          sortBy === "date" && sortOrder === "asc"
                            ? "desc"
                            : "asc";
                        setSortOrder(newOrder);
                        setSortBy("date");
                        sortEventsByDate(newOrder);
                      }}
                      style={{ cursor: "pointer", fontWeight: "bold" }}
                    >
                      Date{" "}
                      {sortBy === "date"
                        ? sortOrder === "asc"
                          ? "↑"
                          : "↓"
                        : ""}
                    </TableCell>

                    <TableCell
                      onClick={() => {
                        const newOrder =
                          sortBy === "distance" && sortOrder === "asc"
                            ? "desc"
                            : "asc";
                        setSortOrder(newOrder);
                        setSortBy("distance");
                        sortEventsByDistance(newOrder);
                      }}
                      style={{ cursor: "pointer", fontWeight: "bold" }}
                    >
                      City{" "}
                      {sortBy === "distance"
                        ? sortOrder === "asc"
                          ? "↑"
                          : "↓"
                        : ""}
                    </TableCell>

                    <TableCell>Venue</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentEvents.map((event) => (
                    <TableRow
                      key={event.id}
                      hover
                      onClick={() => setSelectedEvent(event)}
                      style={{ cursor: "pointer" }}
                    >
                      <TableCell>{event.name}</TableCell>
                      <TableCell>{event.dates?.start?.localDate}</TableCell>
                      <TableCell>
                        {event._embedded?.venues?.[0]?.city?.name &&
                        event._embedded?.venues?.[0]?.state?.name
                          ? `${event._embedded.venues[0].city.name}, ${event._embedded.venues[0].state.name}`
                          : "—"}
                      </TableCell>

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
          
          {/* Pagination and Info */}
          {sortedEvents.length > 0 && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mt: 2,
              flexWrap: 'wrap',
              gap: 2
            }}>
              <Typography variant="body2" color="text.secondary">
                Showing {indexOfFirstEvent + 1}-{Math.min(indexOfLastEvent, sortedEvents.length)} of {sortedEvents.length} events
              </Typography>
              
              {totalPages > 1 && (
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  showFirstButton
                  showLastButton
                  sx={{
                    '& .MuiPaginationItem-root': {
                      color: darkMode ? '#fff' : 'inherit',
                    },
                    '& .MuiPaginationItem-root.Mui-selected': {
                      backgroundColor: '#9a4975ff',
                      color: '#fff',
                    },
                  }}
                />
              )}
            </Box>
          )}
        </CardContent>
      </StyledCard>
      <Dialog
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              backgroundColor: darkMode ? "#1e1e1e" : "#fff",
              color: darkMode ? "#fff" : "#000",
            },
          },
        }}
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
                {selectedEvent?._embedded?.venues?.[0]?.city?.name &&
                selectedEvent?._embedded?.venues?.[0]?.state?.name
                  ? `${selectedEvent?._embedded.venues[0].city.name}, ${selectedEvent?._embedded.venues[0].state.name}`
                  : "—"}
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
          {selectedEvent?.url ? (
            <Button
              variant="contained"
              color="primary"
              href={selectedEvent?.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Buy Tickets
            </Button>
          ) : (
            <Button variant="contained" disabled>
              Buy Tickets
            </Button>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedEvent(null)}>Close</Button>
        </DialogActions>
      </Dialog>
      <footer className={darkMode ? "App-foot-dark" : "App-foot"}>
        <p>powered by team SAND</p>
      </footer>
    </div>
  );
}
