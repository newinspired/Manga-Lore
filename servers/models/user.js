const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  email: { type: String },
  username: { type: String },
  avatar: { type: String },
  premium: { type: Boolean, default: false },
  rankedScore: {
  type: Number,
  default: 0
}
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
