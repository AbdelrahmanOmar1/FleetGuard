// packages
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const app = express();

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
//call routes
const vehiclesRoutes = require("./routes/vechilesRoutes");

// Enable CORS for all routes
app.use(cors());
// parse incoming JSON requests
app.use(express.json());

// modify the morgan middleware to log requests in development mode
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined"));
}

//
app.use("/nahdetmisr/v1/vehicles", vehiclesRoutes);

// error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: "error", message: "Internal Server Error" });
});

// catch-all route for undefined routes
app.use((req, res) => {
  res
    .status(404)
    .json({ status: "error", message: `Route ${req.originalUrl} not found` });
});

module.exports = app;
