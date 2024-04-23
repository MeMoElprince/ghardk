const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');


const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if(allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
}

exports.createOne = (Model, ...allowdFields) => catchAsync(async (req, res, next) => {
    const data = filterObj(req.body, ...allowdFields);
    const doc = await Model.create(data);
    res.status(201).json({
        status: 'success',
        data: {
            doc
        }
    });
});

exports.getAll = (Model) => catchAsync(async (req, res, next) => {
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 10;
    const offset = (page - 1) * limit;
    const docs = await Model.findAll({
        limit,
        offset
    });
    res.status(200).json({
        status: 'success',
        data: {
            docs
        }
    });
});

exports.getOne = (Model) => catchAsync(async (req, res, next) => {
    const doc = await Model.findByPk(req.params.id);
    if(!doc) {
        return next(new AppError('No matching found with that ID', 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            doc
        }
    });
});

exports.updateOne = (Model, ...allowdFields) => catchAsync(async (req, res, next) => {
    const data = filterObj(req.body, ...allowdFields);
    const doc = await Model.findByPk(req.params.id);
    if(!doc) {
        return next(new AppError('No matching found with that ID', 404));
    }
    await doc.update(data);
    res.status(200).json({
        status: 'success',
        data: {
            doc
        }
    });
});

exports.deleteOne = (Model) => catchAsync(async (req, res, next) => {
    const doc = await Model.findByPk(req.params.id);
    if(!doc) {
        return next(new AppError('No matching found with that ID', 404));
    }
    await doc.destroy();
    res.status(204).json({
        status: 'success',
        data: null
    });
});

