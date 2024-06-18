const Address = require('../models/addressModel');
const UserAddress = require('../models/userAddressModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const Sequelize = require("sequelize");
const color = require('../utils/colors');

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if(allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

exports.createAddress = catchAsync(async (req, res, next) => {
    let data = filterObj(req.body, 'street_name', 'city', 'description', 'postal_code', 'country_id');
    const address = await Address.create(data);
    const address_id = address.id;
    data = filterObj(req.body, 'is_default');
    data.user_id = req.user.id;
    data.address_id = address_id;
    try{
        const userAddress = await UserAddress.create(data);
    }
    catch(err){
        await address.destroy();
        return next(new AppError(err.message, 400));
    }
    res.status(201).json({
        status: 'success',
        data: {
            address
        }
    });
});

exports.deleteAddress = catchAsync(async (req, res, next) => {
    const userAddress = await UserAddress.findOne({
        where: {
            user_id: req.user.id,
            id: req.params.id
        }
    });
    if(!userAddress){
        return next(new AppError('No address found with that user', 404));
    }
    const address = await Address.findOne({
        where: {
            id: userAddress.address_id,
        }
    });
    if(!address){
        return next(new AppError('No address found with that ID', 404));
    }
    if(userAddress.is_default)
    {
        const newDefaultUserAddress = await UserAddress.findOne({
            where: {
                user_id: req.user.id,
                id: {
                    [Sequelize.Op.ne]: userAddress.id
                }
            }
        });
        if(newDefaultUserAddress)
        {
            newDefaultUserAddress.is_default = true;
            await newDefaultUserAddress.save();
        }
    }
    await userAddress.destroy();
    await address.destroy();
    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.updateAddress = catchAsync(async (req, res, next) => {
    let data = filterObj(req.body, 'street_name', 'city', 'description', 'postal_code', 'country_id');
    const userAddress = await UserAddress.findOne({
        where: {
            user_id: req.user.id,
            id: req.params.id
        }
    });
    if(!userAddress){
        return next(new AppError('No address found with that user', 404));
    }
    const address = await Address.findOne({
        where: {
            id: userAddress.address_id,
        }
    });
    if(!address){
        return next(new AppError('No address found with that ID', 404));
    }
    if(data.street_name || data.city || data.description || data.postal_code || data.country_id)
        await address.update(data);
    data = filterObj(req.body, 'is_default');
    if(data.is_default)
    {
        userAddress.is_default = data.is_default;
        await userAddress.save();
    }
    res.status(200).json({
        status: 'success',
        data: {
            address
        }
    });
});

exports.getAllAddresses = catchAsync(async (req, res, next) => {
    const userAddresses = await UserAddress.findAll({
        where: {
            user_id: req.user.id
        },
    });
    res.status(200).json({
        status: 'success',
        data: {
            addresses: userAddresses
        }
    });
});

exports.getDefaultAddress = catchAsync(async (req, res, next) => {
    const userAddress = await UserAddress.findOne({
        where: {
            user_id: req.user.id,
            is_default: true
        }
    });
    if(!userAddress){
        return next(new AppError('No default address found', 404));
    }
    const address = await Address.findOne({
        where: {
            id: userAddress.address_id
        }
    });
    res.status(200).json({
        status: 'success',
        data: {
            address
        }
    });
});