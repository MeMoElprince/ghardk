const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

const globalErrorHandler = require('./controllers/globalErrorHandler');
const userRouter = require('./routes/userRouter');
const categoryRouter = require('./routes/categoryRouter');
const productRouter = require('./routes/productRouter');
const cartRouter = require('./routes/cartRouter');
const countryRouter = require('./routes/countryRouter');
const addressRouter = require('./routes/addressRouter');
const productConfigurationRouter = require('./routes/productConfigurationRouter');
const variationRouter = require('./routes/variationRouter');


const app = express();

// cors policy
app.use(cors());
// some security headers
app.use(helmet());

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb'}));


// development logging
if(process.env.NODE_ENV === 'development')
    app.use(morgan('dev'));

// Api routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/carts', cartRouter);
app.use('/api/v1/countries', countryRouter);
app.use('/api/v1/addresses', addressRouter);
app.use('/api/v1/configurations', productConfigurationRouter);
app.use('/api/v1/variations', variationRouter);


// global error handling middleware
app.use(globalErrorHandler);

app.all('*', (req, res) => {
    res.status(404).json({
        status: 'fail',
        message: `Can't find ${req.originalUrl} on this server!`
    });
});

module.exports = app;
