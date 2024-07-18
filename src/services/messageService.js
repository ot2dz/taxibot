let customerBot = null;
let driverBot = null;

const setCustomerBot = (bot) => {
  customerBot = bot;
};

const setDriverBot = (bot) => {
  driverBot = bot;
};

const sendMessageToCustomer = async (userId, message) => {
  if (customerBot) {
    try {
      await customerBot.sendMessage(userId, message);
    } catch (error) {
      console.error('Error sending message to customer:', error);
      throw error;
    }
  } else {
    console.error('Customer bot not initialized');
    throw new Error('Customer bot not initialized');
  }
};

const sendMessageToDriver = async (driverId, message, opts = {}) => {
  if (driverBot) {
    try {
      await driverBot.sendMessage(driverId, message, opts);
    } catch (error) {
      console.error('Error sending message to driver:', error);
      throw error;
    }
  } else {
    console.error('Driver bot not initialized');
    throw new Error('Driver bot not initialized');
  }
};

module.exports = {
  setCustomerBot,
  setDriverBot,
  sendMessageToCustomer,
  sendMessageToDriver,
};