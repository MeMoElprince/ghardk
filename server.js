const dotenv = require('dotenv');
const Sequelize = require('sequelize');

const app = require('./app');
dotenv.config({ path: './config.env' });


const db = require('./config/database');

db.authenticate()
    .then(() => console.log('Database connected...'))
    .catch(err => console.log('Error: ' + err.message))

const port = process.env.PORT || 2000;
const server = app.listen(port, () => console.log(`Server is running on port: ${port}...`));

process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION! Shutting down...');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION! Shutting down...');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});