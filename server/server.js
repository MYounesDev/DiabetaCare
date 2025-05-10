const express = require('express');
const dotenv = require('dotenv');
const app = express();

// Load environment variables from .env file
dotenv.config();

const PORT = process.env.PORT || 5000;






app.use(express.json());
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});