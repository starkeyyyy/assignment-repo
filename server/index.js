const express = require('express');
const http = require("http");
const cors = require('cors');
const app = express();
require('dotenv').config();
const jwt = require("jsonwebtoken");
const gitHubRoutes = require("./router/github");
const testRoutes = require("./router/TextGeneration")

PORT = process.env.PORT || 4000;
app.use(cors({ origin: 'http://localhost:5173', credentials: true}))
app.use(express.json());
app.use("/api/github" , gitHubRoutes );
app.use("/api/test" , testRoutes);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});



