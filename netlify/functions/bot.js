const express = require('express');
const serverless = require('serverless-http');
const bodyParser = require('body-parser');

let customerBot, driverBot;
try {
  const customerBotModule = require('../../src/bots/customerBot');
  const driverBotModule = require('../../src/bots/driverBot');
  customerBot = customerBotModule.customerBot;
  driverBot = driverBotModule.driverBot;
} catch (error) {
  console.error('Error importing bot modules:', error);
}

const app = express();
app.use(bodyParser.json());

// Middleware для проверки безопасности
const securityMiddleware = (req, res, next) => {
  console.log('Received headers:', JSON.stringify(req.headers));
  const secretToken = req.headers['x-telegram-bot-api-secret-token'];
  console.log('Received secret token:', secretToken);
  console.log('Expected secret token:', process.env.WEBHOOK_SECRET_TOKEN);
  if (secretToken !== process.env.WEBHOOK_SECRET_TOKEN) {
    console.error('Invalid secret token');
    return res.sendStatus(403);
  }
  next();
};

app.use(securityMiddleware);

app.post('/', (req, res) => {
  console.log('Received webhook:', JSON.stringify(req.body));

  const chatId = req.body.message?.chat?.id;
  if (!chatId) {
    console.error('No chat ID found in the update');
    return res.sendStatus(400);
  }

  let bot;
  if (chatId.toString().startsWith('1')) {
    bot = customerBot;
    console.log('Processing customer update');
  } else {
    bot = driverBot;
    console.log('Processing driver update');
  }

  if (!bot) {
    console.error('Bot not initialized');
    return res.sendStatus(500);
  }

  try {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error processing update:', error);
    res.sendStatus(500);
  }
});

app.get('/', (req, res) => {
  res.send('Bot service is running!');
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send('Internal Server Error');
});

module.exports.handler = serverless(app);