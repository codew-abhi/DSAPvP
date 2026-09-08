import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true }, // Firebase UID
  username: { type: String, required: true, unique: true },
  email: { type: String },
  photoURL: { type: String },
  displayName: { type: String },
  matchesPlayed: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  rating: { type: Number, default: 1200 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('User', userSchema);
