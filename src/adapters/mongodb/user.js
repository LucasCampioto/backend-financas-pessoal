const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true, select: false },
  },
  {
    toJSON: {
      transform(_, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function createUser(name, email, passwordHash) {
  const user = new User({ name, email, passwordHash });
  await user.save();
  return { _id: user._id, email: user.email, name: user.name };
}

async function findUserByEmail(email) {
  return User.findOne({ email }).select('+passwordHash').lean();
}

async function findUserById(id) {
  return User.findById(id).select('-passwordHash').lean();
}

module.exports = {
  User,
  createUser,
  findUserByEmail,
  findUserById,
};
