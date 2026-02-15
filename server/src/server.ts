import app, { redisClient } from './app.ts';

const PORT = process.env.PORT || 8000;

redisClient
  .connect()
  .then(() => {
    console.log('Connected to Redis');
  })
  .catch(err => {
    console.error('Failed to connect to Redis:', err);
  });

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
