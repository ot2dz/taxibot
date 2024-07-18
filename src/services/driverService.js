const Driver = require('../models/driver');

const createDriver = async (telegramId, name, phoneNumber, carType) => {
  const driver = new Driver({ telegramId, name, phoneNumber, carType });
  await driver.save();
  return driver;
};

const getDriverByTelegramId = async (telegramId) => {
  return await Driver.findOne({ telegramId });
};

const updateDriver = async (telegramId, name, phoneNumber, carType) => {
  return await Driver.findOneAndUpdate(
    { telegramId },
    { name, phoneNumber, carType },
    { new: true }
  );
};

const getAllDrivers = async () => {
  return await Driver.find({});
};

module.exports = { createDriver, getDriverByTelegramId, updateDriver, getAllDrivers };