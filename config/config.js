const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });



module.exports = {
  development: {
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    host: process.env.DATABASE_HOST,
    dialect: process.env.DATABASE_TYPE
  },
  test: {
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    host: process.env.DATABASE_HOST,
    dialect: process.env.DATABASE_TYPE
  },
  // SSL/TLS required 
  production: {
    username: process.env.DATABASE_USERNAME_PROD,
    password: process.env.DATABASE_PASSWORD_PROD,
    database: process.env.DATABASE_NAME_PROD,
    host: process.env.DATABASE_HOST_PROD,
    dialect: process.env.DATABASE_TYPE_PROD,
    dialectOptions: {
      ssl: {
        require: true
      }
    }
  }
}
