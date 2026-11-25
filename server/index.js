import { createApp } from './app.js';
import { readConfig } from './config.js';
import { connectDb } from './db.js';

try {
  const { mongoUri, port } = readConfig();
  await connectDb(mongoUri);
  createApp().listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
} catch (err) {
  console.error(`Server failed to start: ${err.message}`);
  process.exit(1);
}
