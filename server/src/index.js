import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './auth.js';
import cors from 'cors';
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Kanban Board API running');
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});