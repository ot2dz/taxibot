const User = require('../models/user');

const createUser = async (telegramId, name, phoneNumber) => {
  const user = new User({ telegramId, name, phoneNumber });
  await user.save();
  return user;
};

const getUserByTelegramId = async (telegramId) => {
  return await User.findOne({ telegramId });
};

const updateUser = async (telegramId, name, phoneNumber) => {
  return await User.findOneAndUpdate(
    { telegramId },
    { name, phoneNumber },
    { new: true }
  );
};

module.exports = { createUser, getUserByTelegramId, updateUser };