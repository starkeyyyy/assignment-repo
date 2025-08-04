const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

router.get('/login', (req, res) => {
    console.log("hellow")
  try{const redirect_uri = 'http://localhost:5000/api/github/callback';
  const scope = 'repo'; // Use 'repo' to access private repos
  const client_id = process.env.CLIENT_ID;

  const githubAuthURL = `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${scope}`;
  res.redirect(githubAuthURL);}
  catch(error){
    console.log(error);
  }
});

router.get('/file-content/:owner/:repo/:branch/:path', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { owner, repo, branch, path } = req.params;

  try {
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3.raw', // 👈 CRUCIAL for getting code
        },
      }
    );

    res.send(response.data); // raw code/text
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({
      error: 'Failed to fetch file content',
      details: err.message,
    });
  }
});




router.get('/callback', async (req, res) => {
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
        headers: { Accept: 'application/json' },
      }
    );

    const access_token = response.data.access_token;
    res.redirect(`${process.env.FRONTEND_URL}?token=${access_token}`);
  } catch (err) {
    res.status(500).json({ error: 'OAuth callback failed', details: err.message });
  }
});


router.get('/repos', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log("this was also run")
  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    const result = await axios.get('https://api.github.com/user/repos', {
      headers: { Authorization: `Bearer ${token}` },
    });

    res.json(result.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch repos', details: err.message });
  }
});


router.get('/files/:owner/:repo', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { owner, repo } = req.params;

  try {
    const repoData = await axios.get(`https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const files = repoData.data.tree.filter(item => item.type === 'blob');
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch files', details: err.message });
  }
});

router.post('/authenticate', async (req, res) => {
  const code = req.body.code;

  try {
    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: 'application/json' } }
    );

    res.json({ access_token: tokenRes.data.access_token });
  } catch (err) {
    res.status(500).json({ error: 'OAuth token exchange failed', details: err.message });
  }
});

// Get content of a specific file




module.exports = router;

