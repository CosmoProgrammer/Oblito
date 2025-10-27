import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 8000;

dotenv.config();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.post('/auth/login', (req, res) => {
  console.log('Received login request');
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }
  return res.status(200).json({ message: 'Logged in', user: { username } });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});