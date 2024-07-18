const express = require('express');
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const { customerBot } = require('../../src/bots/customerBot');
const { driverBot } = require('../../src/bots/driverBot');

const app = express();
app.use(bodyParser.json());

// ميدلوير للتحقق من الأمان
const securityMiddleware = (req, res, next) => {
  const secretToken = req.headers['x-telegram-bot-api-secret-token'];
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
  if (chatId.toString().startsWith('1')) { // افتراض أن معرفات العملاء تبدأ بـ 1
    bot = customerBot;
    console.log('Processing customer update');
  } else {
    bot = driverBot;
    console.log('Processing driver update');
  }

  try {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error processing update:', error);
    res.sendStatus(500);
  }
});

// للتحقق من أن الخدمة تعمل
app.get('/', (req, res) => {
  res.send('Bot service is running!');
});

// معالجة الأخطاء
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send('Internal Server Error');
});

module.exports.handler = serverless(app);