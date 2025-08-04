const express = require('express')
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

router.get("/generate-test-cases" , async (req , res) => {
     try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1",
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("Generated Test Case Summary:");
    console.log(response.data);
  } catch (error) {
    console.error("Error generating test case:", error.response?.data || error.message);
  }
})


module.exports = router;