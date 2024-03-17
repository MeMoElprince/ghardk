const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');




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




app.all('*', (req, res) => {
    res.status(404).json({
        status: 'fail',
        message: `Can't find ${req.originalUrl} on this server!`
    });
});

module.exports = app;
