require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { connectToDatabase } = require('./config/database');
const customerBot = require('./bots/customerBot');
const driverBot = require('./bots/driverBot');

// اتصال بقاعدة البيانات
connectToDatabase();

if (!process.env.NETLIFY) {
  const app = express();
  app.use(bodyParser.json());

  app.post(`/webhook/${process.env.CUSTOMER_BOT_TOKEN}`, (req, res) => {
    customerBot.processUpdate(req.body);
    res.sendStatus(200);
  });

  app.post(`/webhook/${process.env.DRIVER_BOT_TOKEN}`, (req, res) => {
    driverBot.processUpdate(req.body);
    res.sendStatus(200);
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}