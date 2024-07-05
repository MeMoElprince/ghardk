const AppError = require('../utils/AppError');
const Notification = require('../models/notificationModel');
const catchAsync = require('../utils/catchAsync');
const db = require('../config/database');





exports.getMyNotifications = catchAsync(async (req, res, next) => {
    const { id } = req.user;
    const notifications = await Notification.findAll({ 
        where: {
            user_id: id
        } 
    });
    res.status(200).json({
        status: 'success',
        data: {
            count: notifications.length,
            notifications
        }
    });
});



exports.getNotification = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const notification = await Notification.findOne({ 
        where: {
            id
        } 
    });
    if (!notification) {
        return next(new AppError('Notification not found', 404));
    }
    const userId = req.user.id;
    if(notification.user_id !== userId) {
        return next(new AppError('You are not authorized to view this notification', 403));
    }

    

    res.status(200).json({
        status: 'success',
        data: {
            notification
        }
    }); 
});


