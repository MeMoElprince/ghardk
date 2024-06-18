const AppError = require('../utils/AppError');


const sendErrorDev = (err, res) => {
    console.log(err);
    console.log(err.message);
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

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if(process.env.NODE_ENV === 'development') {
        return sendErrorDev(err, res);
    } 
    else if(process.env.NODE_ENV === 'production') {
        let error = {...err};
        error.message = err.message;
        
        // handle untrusted errors in production to be trusted
        // to be continued...

        sendErrorProd(error, res);
    }
}