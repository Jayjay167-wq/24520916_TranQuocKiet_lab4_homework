import mongoose from 'mongoose';

export const SWIPE_ACTIONS = Object.freeze(['LIKE', 'NOPE', 'SUPERLIKE']);

const profileSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  age: { type: Number, required: true, min: 18 },
  bio: { type: String, default: '' },
});

const swipeSchema = new mongoose.Schema(
  {
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
    action: { type: String, enum: SWIPE_ACTIONS, required: true },
  },
  { timestamps: true },
);

export const Profile = mongoose.models.Profile ?? mongoose.model('Profile', profileSchema);
export const Swipe = mongoose.models.Swipe ?? mongoose.model('Swipe', swipeSchema);
