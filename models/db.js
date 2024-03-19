const {Pool} = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: true
    }
});

pool.connect((err) => {
    if(err)
        console.error('connection error', err.stack);
    else 
        console.log('Connected to Postgres...');
});

module.exports = pool;