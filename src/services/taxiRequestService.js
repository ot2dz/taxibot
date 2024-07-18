const mongoose = require('mongoose');
const { getAllDrivers, getDriverByTelegramId } = require('./driverService');
const { sendMessageToCustomer, sendMessageToDriver } = require('./messageService');

// تعريف نموذج طلب التاكسي
const taxiRequestSchema = new mongoose.Schema({
  customerId: String,
  address: String,
  status: { type: String, enum: ['pending', 'accepted', 'completed'], default: 'pending' },
  driverId: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});

const TaxiRequest = mongoose.model('TaxiRequest', taxiRequestSchema);

const requestTaxi = async (user, address) => {
  const request = new TaxiRequest({
    customerId: user.telegramId,
    address
  });
  await request.save();

  const drivers = await getAllDrivers();
  
  for (const driver of drivers) {
    const message = `طلب جديد للتاكسي:\nالاسم: ${user.name}\nالعنوان: ${address}`;
    const opts = {
      reply_markup: {
        inline_keyboard: [[
          { text: "قبول الطلب", callback_data: `accept_${request._id}` }
        ]]
      }
    };
    await sendMessageToDriver(driver.telegramId, message, opts);
  }

  return request;
};

const handleAcceptRequest = async (driverId, requestId) => {
  const updatedRequest = await TaxiRequest.findOneAndUpdate(
    { _id: requestId, status: 'pending' },
    { status: 'accepted', driverId, updatedAt: Date.now() },
    { new: true }
  );

  if (!updatedRequest) {
    await sendMessageToDriver(driverId, "عذرًا، تم قبول هذا الطلب بالفعل أو لم يعد متاحًا.");
    return null;
  }

  const driver = await getDriverByTelegramId(driverId);

  await sendMessageToCustomer(updatedRequest.customerId, `تم قبول طلبك من قبل السائق ${driver.name}. رقم هاتفه: ${driver.phoneNumber}. نوع السيارة: ${driver.carType}`);
  await sendMessageToDriver(driverId, "لقد قبلت الطلب بنجاح. يرجى الاتصال بالزبون للتأكيد على التفاصيل.");

  // إلغاء الطلب للسائقين الآخرين
  const allDrivers = await getAllDrivers();
  const cancelPromises = allDrivers
    .filter(otherDriver => otherDriver.telegramId.toString() !== driverId.toString())
    .map(otherDriver => 
      sendMessageToDriver(otherDriver.telegramId, `تم قبول الطلب السابق من قبل سائق آخر.`, {
        reply_markup: {
          inline_keyboard: [[
            { text: "حسناً", callback_data: `cancel_notification_${requestId}` }
          ]]
        }
      })
    );

  await Promise.all(cancelPromises);

  return {
    customerId: updatedRequest.customerId,
    driverName: driver.name,
    driverPhone: driver.phoneNumber,
    carType: driver.carType
  };
};

const getActiveRequests = async () => {
  return await TaxiRequest.find({ status: 'pending' });
};

const cancelRequest = async (requestId) => {
  const updatedRequest = await TaxiRequest.findByIdAndUpdate(
    requestId,
    { status: 'cancelled', updatedAt: Date.now() },
    { new: true }
  );

  if (updatedRequest) {
    await sendMessageToCustomer(updatedRequest.customerId, "تم إلغاء طلبك للتاكسي.");
    
    if (updatedRequest.driverId) {
      await sendMessageToDriver(updatedRequest.driverId, "تم إلغاء الطلب من قبل الزبون.");
    }

    return true;
  }

  return false;
};

const completeRequest = async (requestId) => {
  const updatedRequest = await TaxiRequest.findByIdAndUpdate(
    requestId,
    { status: 'completed', updatedAt: Date.now() },
    { new: true }
  );

  if (updatedRequest) {
    await sendMessageToCustomer(updatedRequest.customerId, "تم إكمال رحلتك. شكرًا لاستخدامك خدمتنا!");
    await sendMessageToDriver(updatedRequest.driverId, "تم إكمال الرحلة بنجاح. شكرًا لك!");
    return true;
  }

  return false;
};

module.exports = { 
  requestTaxi, 
  handleAcceptRequest, 
  getActiveRequests,
  cancelRequest,
  completeRequest
};