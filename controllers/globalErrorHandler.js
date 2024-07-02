const AppError = require('../utils/AppError');
const color = require('../utils/colors');

const sendErrorDev = (err, res) => {
    return res.status(err.statusCode).json({
        status: err.status,
        statusCode: err.statusCode,
        message: err.message,
        stack: err.stack,
        error: err,
    })
}

const sendErrorProd = (err, res) => {
    if(err.isOperational) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }
    console.log('Production ERROR!!: ', err);
    return res.status(500).json({
        status: 'error',
        message: 'Something went wrong, Sorry!'
    });
}


const handleDuplicateFieldsDB = (err) => {
    const message = err.errors[0].message;
    err = new AppError(message, 400);
    return err;
}



module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if(process.env.NODE_ENV === 'development') {
        return sendErrorDev(err, res);
    } 
    else if(process.env.NODE_ENV === 'production') {
        let error = {...err};
        error.message = err.message;
        if(error?.original?.code === "23505")
        {
            error = handleDuplicateFieldsDB(error);
        }  
        else if(error?.original?.code === "23503") {
            const message = 'Invalide operation or data provided';
            error = new AppError(message, 400);
        }   
        else if(error?.original?.code === "22P02") {
            const message = 'Invalid data provided';
            error = new AppError(message, 400);
        }
        else if(error?.original?.code === "23502") {
            // apropriate message for check_violation
            const message = "A required field is missing.";
            error = new AppError(message, 400);
        }
        else if(error.name === 'SequelizeValidationError')
        {
            const message = error.errors.map(el => el.message).join(', ');
            error = new AppError(message, 400);
        }
        sendErrorProd(error, res);
    }
}