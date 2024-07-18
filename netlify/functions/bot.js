const serverless = require('serverless-http');
const express = require('express');
const bodyParser = require('body-parser');
const customerBot = require('../../src/bots/customerBot');
const driverBot = require('../../src/bots/driverBot');

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

// للتحقق من أن الخدمة تعمل
app.get('/', (req, res) => {
  res.send('Bot service is running!');
});

exports.handler = serverless(app);