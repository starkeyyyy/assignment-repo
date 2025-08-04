const express = require('express');
const http = require("http");
const cors = require('cors');
const app = express();
require('dotenv').config();
const jwt = require("jsonwebtoken");

const server = http.createServer(app);//need to do for the socket io app, other wise we can just use the app*




PORT = process.env.PORT || 4000;
app.use(cors({ origin: 'http://localhost:5000', credentials: true}))


app.use(express.json());








app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});



