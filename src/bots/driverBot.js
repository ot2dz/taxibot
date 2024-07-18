const TelegramBot = require('node-telegram-bot-api');
const { createDriver, getDriverByTelegramId, updateDriver } = require('../services/driverService');
const { setDriverBot } = require('../services/messageService');
const { handleAcceptRequest } = require('../services/taxiRequestService');

let bot;

if (process.env.NETLIFY) {
  bot = new TelegramBot(process.env.DRIVER_BOT_TOKEN);
  bot.setWebHook(`${process.env.URL}/.netlify/functions/bot/webhook/${process.env.DRIVER_BOT_TOKEN}`);
} else {
  bot = new TelegramBot(process.env.DRIVER_BOT_TOKEN, { polling: true });
}

setDriverBot(bot);

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const keyboard = {
    keyboard: [
      [{ text: "تسجيل كسائق" }],
      [{ text: "معلوماتي" }],
      [{ text: "تعديل معلوماتي" }]
    ],
    resize_keyboard: true
  };
  bot.sendMessage(chatId, "مرحبا بك في خدمة الطاكسي للسائقين. ماذا تريد أن تفعل؟", { reply_markup: keyboard });
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  switch (text) {
    case "تسجيل كسائق":
      bot.sendMessage(chatId, "الرجاء إدخال اسمك الكامل:");
      bot.once('message', (nameMsg) => {
        const name = nameMsg.text;
        bot.sendMessage(chatId, "شكرًا. ما هو رقم هاتفك؟");
        bot.once('message', (phoneMsg) => {
          const phoneNumber = phoneMsg.text;
          bot.sendMessage(chatId, "شكرًا. ما هو نوع سيارتك؟");
          bot.once('message', async (carMsg) => {
            const carType = carMsg.text;
            await createDriver(chatId, name, phoneNumber, carType);
            bot.sendMessage(chatId, "تم تسجيلك كسائق بنجاح.");
          });
        });
      });
      break;
    case "معلوماتي":
      const driverInfo = await getDriverByTelegramId(chatId);
      if (driverInfo) {
        bot.sendMessage(chatId, `اسمك: ${driverInfo.name}\nرقم هاتفك: ${driverInfo.phoneNumber}\nنوع سيارتك: ${driverInfo.carType}`);
      } else {
        bot.sendMessage(chatId, "لم يتم العثور على معلوماتك. يرجى التسجيل أولاً.");
      }
      break;
    case "تعديل معلوماتي":
      bot.sendMessage(chatId, "الرجاء إدخال اسمك الجديد:");
      bot.once('message', (newNameMsg) => {
        const newName = newNameMsg.text;
        bot.sendMessage(chatId, "شكرًا. الرجاء إدخال رقم هاتفك الجديد:");
        bot.once('message', (newPhoneMsg) => {
          const newPhoneNumber = newPhoneMsg.text;
          bot.sendMessage(chatId, "شكرًا. الرجاء إدخال نوع سيارتك الجديد:");
          bot.once('message', async (newCarMsg) => {
            const newCarType = newCarMsg.text;
            await updateDriver(chatId, newName, newPhoneNumber, newCarType);
            bot.sendMessage(chatId, "تم تحديث معلوماتك بنجاح.");
          });
        });
      });
      break;
  }
});

bot.on('callback_query', async (callbackQuery) => {
  const driverId = callbackQuery.from.id;
  const [action, ...params] = callbackQuery.data.split('_');

  switch (action) {
    case 'accept':
      const requestId = params[0];
      try {
        const result = await handleAcceptRequest(driverId, requestId);
        if (result) {
          await bot.answerCallbackQuery(callbackQuery.id, { text: "تم قبول الطلب بنجاح" });
          await bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
            chat_id: callbackQuery.message.chat.id,
            message_id: callbackQuery.message.message_id
          });
        } else {
          await bot.answerCallbackQuery(callbackQuery.id, { text: "عذرًا، تم قبول هذا الطلب بالفعل أو لم يعد متاحًا." });
          await bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
            chat_id: callbackQuery.message.chat.id,
            message_id: callbackQuery.message.message_id
          });
        }
      } catch (error) {
        console.error('Error handling accept request:', error);
        await bot.answerCallbackQuery(callbackQuery.id, { text: "حدث خطأ أثناء معالجة الطلب. الرجاء المحاولة مرة أخرى." });
      }
      break;
    case 'cancel':
      if (params[0] === 'notification') {
        await bot.answerCallbackQuery(callbackQuery.id);
        await bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
          chat_id: callbackQuery.message.chat.id,
          message_id: callbackQuery.message.message_id
        });
      }
      break;
  }
});


module.exports = bot;