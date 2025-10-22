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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});