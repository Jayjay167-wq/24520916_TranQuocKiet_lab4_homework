import mongoose from 'mongoose';
import { readConfig } from './config.js';
import { connectDb } from './db.js';
import { Profile } from './models.js';

const PROFILES = [
  { name: 'An', age: 22, bio: 'Thích trà sữa và nhạc indie.' },
  { name: 'Bình', age: 24, bio: 'Chạy bộ mỗi sáng, ghét dậy sớm.' },
  { name: 'Chi', age: 23, bio: 'Nuôi ba con mèo, không nuôi người yêu.' },
  { name: 'Dũng', age: 25, bio: 'Leo rank cả đêm, ngủ cả ngày.' },
];

try {
  await connectDb(readConfig().mongoUri);
  if ((await Profile.countDocuments()) === 0) {
    await Profile.insertMany(PROFILES);
    console.log(`Seeded ${PROFILES.length} profiles.`);
  } else {
    console.log('Profiles already present; nothing to seed.');
  }
} catch (err) {
  console.error(`Seed failed: ${err.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
