import { useCallback, useState } from 'react'
import axios from 'axios'
import { FarcasterEmbed } from "react-farcaster-embed/dist/client";

interface FarcasterComment {
  fid: number
  timestamp: number
  username: string
  hash: string
}

function App() {
  const [fid, setFid] = useState('')
  const [parentHash, setParentHash] = useState('')
  const [comments, setComments] = useState<FarcasterComment[]>([])

  const fetchComments = useCallback(async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_HOST}/comments/${fid}/${parentHash}`)
      setComments(response.data)
    } catch (err) {
      console.error(err)
      window.alert('Load failed')
    }
  }, [fid, parentHash])

  console.log(comments)

  return (
    <>
      <div>
        Farcaster Comments

        <div style={{
          marginTop: 16,
          marginBottom: 16,
        }}>
          <div style={{ marginBottom: 8 }}>
            FID: <input value={fid} onChange={e => setFid(e.target.value)}></input>
          </div>
          <div style={{ marginBottom: 8 }}>
            Hash: <input value={parentHash} onChange={e => setParentHash(e.target.value)}></input>
          </div>
          <div>
            <button onClick={() => fetchComments()}>Load</button>
          </div>
        </div>

        {comments.map(comment => (
          <div key={comment.hash}>
            <FarcasterEmbed username={comment.username} hash={comment.hash} />
          </div>
        ))}
      </div>
    </>
  )
}

export default App
