require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// Schema
const userSchema = new mongoose.Schema({
  userId: Number,
  username: String,
  avatarUrl: String,
  executions: { type: Number, default: 1 },
  games: [{
    gameId: String,
    gameName: String,
    placeId: Number,
    executions: Number
  }],
  lastUsed: Number
});

const User = mongoose.model('User', userSchema);

// ➕ POST /submit — Receive Data from Roblox Script
app.post('/submit', async (req, res) => {
  try {
    const {
      userId,
      username,
      avatarUrl,
      gameId,
      placeId,
      gameName,
      timestamp
    } = req.body;

    let user = await User.findOne({ userId });

    if (!user) {
      user = new User({
        userId,
        username,
        avatarUrl,
        executions: 1,
        games: [{
          gameId,
          gameName,
          placeId,
          executions: 1
        }],
        lastUsed: timestamp
      });
    } else {
      user.executions += 1;
      user.username = username;
      user.avatarUrl = avatarUrl;
      user.lastUsed = timestamp;

      const game = user.games.find(g => g.gameId === gameId);
      if (game) {
        game.executions += 1;
      } else {
        user.games.push({
          gameId,
          gameName,
          placeId,
          executions: 1
        });
      }
    }

    await user.save();
    res.status(200).json({ message: 'Data saved successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// 🔍 GET /search?userId=... OR ?username=...
app.get('/search', async (req, res) => {
  const { userId, username } = req.query;

  let query = {};
  if (userId) query.userId = Number(userId);
  if (username) query.username = username;

  const user = await User.findOne(query);
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json(user);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
