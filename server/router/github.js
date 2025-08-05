const express = require("express");
const router = express.Router();
const axios = require("axios");
require("dotenv").config();

router.get("/login", (req, res) => {
  try {
    const redirect_uri = "http://localhost:5000/api/github/callback";
    const scope = "repo"; // Use 'repo' to access private repos
    const client_id = process.env.CLIENT_ID;

    const githubAuthURL = `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${scope}`;
    res.redirect(githubAuthURL);
  } catch (error) {
    console.log(error);
  }
});

router.get("/file-content/:owner/:repo/:branch/:path", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { owner, repo, branch, path } = req.params;

  try {
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3.raw", // 👈 CRUCIAL for getting code
        },
      }
    );

    res.send(response.data); // raw code/text
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({
      error: "Failed to fetch file content",
      details: err.message,
    });
  }
});

router.get("/callback", async (req, res) => {
  const code = req.query.code;

  try {
    const response = await axios.post(
      `https://github.com/login/oauth/access_token`,
      {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code,
      },
      {
        headers: { Accept: "application/json" },
      }
    );

    const access_token = response.data.access_token;
    res.redirect(`${process.env.FRONTEND_URL}?token=${access_token}`);
  } catch (err) {
    res
      .status(500)
      .json({ error: "OAuth callback failed", details: err.message });
  }
});

router.get("/repos", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const result = await axios.get("https://api.github.com/user/repos", {
      headers: { Authorization: `Bearer ${token}` },
    });

    res.json(result.data);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch repos", details: err.message });
  }
});

router.get("/files/:owner/:repo", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { owner, repo } = req.params;

  try {
    const repoData = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const files = repoData.data.tree.filter((item) => item.type === "blob");
    res.json(files);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch files", details: err.message });
  }
});

router.post("/authenticate", async (req, res) => {
  const code = req.body.code;

  try {
    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: "application/json" } }
    );

    res.json({ access_token: tokenRes.data.access_token });
  } catch (err) {
    res
      .status(500)
      .json({ error: "OAuth token exchange failed", details: err.message });
  }
});



router.post("/create-pr", async (req, res) => {
  try {
    const {
      githubToken,
      owner,
      repo,
      baseBranch = "main",
      newBranch,
      filePath,
      testCode,
    } = req.body;

    if (!githubToken || !owner || !repo || !newBranch || !filePath || !testCode) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const headers = {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    };

    // 1. Get latest commit SHA on base branch
    const baseRef = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`,
      { headers }
    );
    const baseSha = baseRef.data.object.sha;

    // 2. Create a new branch from that commit
    await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/git/refs`,
      {
        ref: `refs/heads/${newBranch}`,
        sha: baseSha,
      },
      { headers }
    );

    // 3. Create or update file on new branch
    await axios.put(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        message: "Add AI-generated test case",
        content: Buffer.from(testCode).toString("base64"),
        branch: newBranch,
      },
      { headers }
    );

    // 4. Create Pull Request
    const prResponse = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/pulls`,
      {
        title: "Add AI-generated test case",
        head: newBranch,
        base: baseBranch,
        body: "This PR adds test cases generated by AI.",
      },
      { headers }
    );

    res.json({
      success: true,
      pullRequestUrl: prResponse.data.html_url,
    });
  } catch (error) {
    console.error("PR Creation Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to create pull request" });
  }
});





module.exports = router;
