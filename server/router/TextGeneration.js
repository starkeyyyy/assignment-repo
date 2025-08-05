const express = require("express");
const router = express.Router();
const axios = require("axios");
require("dotenv").config();

const HF_TOKEN = process.env.HUGGING_FACE_TOKEN;

// Utility: merge selected file contents into one string
const mergeFileContents = (files) => {
  return files
    .map((file) => `// File: ${file.filename}\n${file.content}`)
    .join("\n\n");
};

// 🧠 Route 1: Generate Test Case Summaries
router.post("/generate-test-case-summaries", async (req, res) => {
  console.log("loading");
  try {
    const { files } = req.body;
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: "No files provided" });
    }

    const code = mergeFileContents(files);

    const messages = [
      {
        role: "system",
        content: "You are a QA expert. Analyze code and write high-level test cases in plain English.",
      },
      {
        role: "user",
        content: `Analyze the following code and generate a numbered list of test cases:\n\n${code}`,
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

    const text = response.data.choices[0]?.message?.content || "";
    const summaries = text.split("\n").filter((line) => line.trim().length > 0);

    res.json({ summaries });
  } catch (error) {
    console.error(
      "Error generating test case summaries:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to generate test case summaries" });
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
    content: "You are a senior test automation engineer. Generate clean, working test code in the language used in the given code. Do NOT return markdown formatting. Only return raw source code.",
  },
  {
    role: "user",
    content: `Write a test case code for the following scenario as code. 
Include the test case description as a comment at the top, using the correct comment syntax of the language used in the code below.

Test Case Description:
"${summary}"

Relevant Code:
${code}

Use Jest + React Testing Library if it's JavaScript/React and Selenium if it's Python and other Languages if any other Language is used. Just output raw code.`,
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

    const testCode = response.data.choices[0]?.message?.content || "";
    res.json({ testCode });
  } catch (error) {
    console.error(
      "Error generating test case code:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to generate test case code" });
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

    console.log("✅ Hugging Face Response:", JSON.stringify(response.data, null, 2));
    res.json(response.data);
  } catch (error) {
    console.error("❌ Error from Hugging Face:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to connect to Hugging Face" });
  }
});

module.exports = router;
