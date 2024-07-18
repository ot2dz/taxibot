const TelegramBot = require('node-telegram-bot-api');
const { createUser, getUserByTelegramId, updateUser } = require('../services/userService');
const { requestTaxi } = require('../services/taxiRequestService');
const { setCustomerBot } = require('../services/messageService');

let bot;

if (process.env.NETLIFY) {
  bot = new TelegramBot(process.env.CUSTOMER_BOT_TOKEN);
  bot.setWebHook(`${process.env.URL}/.netlify/functions/bot/webhook/${process.env.CUSTOMER_BOT_TOKEN}`);
} else {
  bot = new TelegramBot(process.env.CUSTOMER_BOT_TOKEN, { polling: true });
}

setCustomerBot(bot);

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const keyboard = {
    keyboard: [
      [{ text: "أريد طاكسي" }],
      [{ text: "معلوماتي" }],
      [{ text: "تعديل معلوماتي" }]
    ],
    resize_keyboard: true
  };
  bot.sendMessage(chatId, "مرحبا بك في خدمة طلب الطاكسي. ماذا تريد أن تفعل؟", { reply_markup: keyboard });
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  switch (text) {
    case "أريد طاكسي":
      const user = await getUserByTelegramId(chatId);
      if (user) {
        bot.sendMessage(chatId, "الرجاء إدخال عنوانك الحالي:");
        bot.once('message', async (addressMsg) => {
          const address = addressMsg.text;
          await sendMessageToCustomer(chatId, "تم إرسال طلبك. سنعلمك عندما يقبل سائق طلبك.");
          await requestTaxi(user, address);
        });
      } else {
        bot.sendMessage(chatId, "يرجى التسجيل أولاً. ما هو اسمك؟");
        bot.once('message', (nameMsg) => {
          const name = nameMsg.text;
          bot.sendMessage(chatId, "شكرًا. ما هو رقم هاتفك؟");
          bot.once('message', async (phoneMsg) => {
            const phoneNumber = phoneMsg.text;
            await createUser(chatId, name, phoneNumber);
            bot.sendMessage(chatId, "تم تسجيلك بنجاح. يمكنك الآن طلب طاكسي.");
          });
        });
      }
      break;
    case "معلوماتي":
      const userInfo = await getUserByTelegramId(chatId);
      if (userInfo) {
        bot.sendMessage(chatId, `اسمك: ${userInfo.name}\nرقم هاتفك: ${userInfo.phoneNumber}`);
      } else {
        bot.sendMessage(chatId, "لم يتم العثور على معلوماتك. يرجى التسجيل أولاً.");
      }
      break;
    case "تعديل معلوماتي":
      bot.sendMessage(chatId, "الرجاء إدخال اسمك الجديد:");
      bot.once('message', (newNameMsg) => {
        const newName = newNameMsg.text;
        bot.sendMessage(chatId, "شكرًا. الرجاء إدخال رقم هاتفك الجديد:");
        bot.once('message', async (newPhoneMsg) => {
          const newPhoneNumber = newPhoneMsg.text;
          await updateUser(chatId, newName, newPhoneNumber);
          bot.sendMessage(chatId, "تم تحديث معلوماتك بنجاح.");
        });
      });
      break;
  }
});

module.exports = bot;