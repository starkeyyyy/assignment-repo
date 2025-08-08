const express = require("express");
const router = express.Router();
const axios = require("axios");
require("dotenv").config();
const {jsonrepair} = require("jsonrepair");

const HF_TOKEN = process.env.HUGGING_FACE_TOKEN;

// Utility: merge selected file contents into one string
const mergeFileContents = (files) => {
  return files
    .map((file) => `// File: ${file.filename}\n${file.content}`)
    .join("\n\n");
};

// 🧠 Route 1: Generate Test Case Summaries
router.post("/generate-test-case-summaries", async (req, res) => {
  console.log("loading...")
  try {
    const { files } = req.body;
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: "No files provided" });
    }

    const code = mergeFileContents(files);

    const messages = [
      {
        role: "system",
        content:
          "You are a QA expert. Analyze code and write high-level test cases in plain English. Respond only in raw valid JSON format without markdown or any explanation.",
      },
      {
        role: "user",
        content: `Analyze the following code and return a JSON response with the format:

{
  "analysis_and_summary": "Brief summary of the code and its purpose.",
  "test_cases": {
    "filename1": [
      { "name": "Test case 1 name", "description": "Description of the test case" },
      { "name": "Test case 2 name", "description": "Description of the test case" }
    ],
    "filename2": [
      { "name": "Test case A name", "description": "Description of test case A" }
    ]
  },
  "remarks_and_notes": "Additional QA-specific notes, edge cases, or potential risks."
}

Here is the code to analyze:\n\n${code}`,
      },
    ];

    const response = await axios.post(
      "https://router.huggingface.co/v1/chat/completions",
      {
        model: "meta-llama/Llama-3.1-8B-Instruct:novita",
        messages,
      },
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const rawText = response.data.choices[0]?.message?.content || "";

    let parsedJSON;

    try {
      parsedJSON = JSON.parse(jsonrepair(rawText));
      console.log("conpleted" , parsedJSON)
    } catch (err) {
      console.error("❌ Failed to repair/parse JSON:", err.message);
      return res.status(500).json({
        error: "Model returned invalid JSON",
        raw: rawText,
      });
    }

    return res.json(parsedJSON); // ✅ Send response once, and only here
  } catch (error) {
    console.error("Error generating test case summaries:", error);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Failed to generate test case summaries" });
    }
  }
});


// 🧪 Route 2: Generate Test Case Code from Summary
router.post("/generate-test-code", async (req, res) => {
  try {
    const { summary, files } = req.body;
    if (!summary || !files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: "Missing summary or files" });
    }

    const code = mergeFileContents(files);

    const messages = [
  {
    role: "system",
    content:
      "You are a senior test automation engineer. Your job is to generate clean, working test code in the appropriate language. Only output JSON in the following format:\n\n{\n  \"description_and_library\": String, // A short sentence explaining the testing library used\n  \"code\": String, // The raw test code without markdown\n  \"language\": String // Language name like JavaScript, Python, etc.\n}\n\nDo NOT return markdown or any extra explanation. Only return the JSON object as described.",
  },
  {
    role: "user",
    content: `Write a test case for the following scenario.

Test Case Description:
"${summary}"

Relevant Code:
${code}

Use Jest + React Testing Library if it's JavaScript/React, Selenium for Python, and appropriate libraries for other languages.

Just return the JSON response as described. Do NOT include markdown or extra explanation.`,
  },
];


    const response = await axios.post(
      "https://router.huggingface.co/v1/chat/completions",
      {
        model: "meta-llama/Llama-3.1-8B-Instruct:novita",
        messages,
      },
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const rawText = response.data.choices[0]?.message?.content || "";
    let parsedJSON;

    try {
      parsedJSON = JSON.parse(jsonrepair(rawText));
      console.log("conpleted" , parsedJSON)
    } catch (err) {
      console.error("❌ Failed to repair/parse JSON:", err.message);
      return res.status(500).json({
        error: "Model returned invalid JSON",
        raw: rawText,
      });
    }

    return res.json(parsedJSON); // ✅ Send response once, and only here

  }  catch (error) {
    console.error("Error generating test case code:", error);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Failed to generate test case code" });
    }
  }
});

// 🧪 Simple Testing Route
router.post("/testing", async (req, res) => {
  const data = {
    model: "meta-llama/Llama-3.1-8B-Instruct:novita",
    messages: [
      {
        role: "user",
        content: "What is the capital of France?",
      },
    ],
  };

  try {
    const response = await axios.post(
      "https://router.huggingface.co/v1/chat/completions",
      data,
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(
      "✅ Hugging Face Response:",
      JSON.stringify(response.data, null, 2)
    );
    res.json(response.data);
  } catch (error) {
    console.error(
      "❌ Error from Hugging Face:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to connect to Hugging Face" });
  }
});

module.exports = router;
