import { config as dotenv } from 'dotenv'
dotenv()

import express from 'express';
import axios from 'axios'
import cors from 'cors';
import NodeCache from 'node-cache';
import { uniq } from 'lodash';

interface FarcasterComment {
  fid: number
  timestamp: number
  username: string
  hash: string
}

const mainCache = new NodeCache({ stdTTL: 60 });

// Create an Express app
const app = express();
const port = 4200;

// Use CORS middleware
app.use(express.json())
app.use(cors());

// Fetch comments hash
async function fetchComments(fid: number, hash: string) {
  const cacheKey = `COMMENTS_${fid}_${hash}`;
  const cachedData = mainCache.get(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  const response = await axios.get('https://hub-api.neynar.com/v1/castsByParent', {
    params: {
      fid,
      hash,
    },
    headers: {
      'api_key': process.env.NEYNAR_API_KEY,
    }
  })

  const fids = uniq(response.data.messages.map((x: any) => x.data.fid))

  const usersResponse = await axios.get('https://api.neynar.com/v2/farcaster/user/bulk', {
    params: {
      fids: fids.join(','),
    },
    headers: {
      'api_key': process.env.NEYNAR_API_KEY,
    }
  })

  const usernameMap: {[fid: number]: string} = {}
  for (const user of usersResponse.data.users) {
    usernameMap[user.fid] = user.username
  }

  const comments: FarcasterComment[] = response.data.messages.map((x: any) => ({
    fid: x.data.fid,
    timestamp: x.data.timestamp,
    username: usernameMap[x.data.fid],
    hash: x.hash
  }))

  comments.sort((a, b) => b.timestamp - a.timestamp)

  mainCache.set(cacheKey, comments)

  return comments
}

app.get('/comments/:fid/:hash', async (req, res) => {
  try {
    const comments = await fetchComments(parseInt(req.params.fid), req.params.hash);
    res.json(comments);
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch attestations' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
