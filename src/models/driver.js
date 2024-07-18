const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  carType: { type: String, required: true },
});

module.exports = mongoose.model('Driver', driverSchema);