require('dotenv').config();

const Knex = require('knex');

const knex = Knex({
    client: 'pg',
    connection: {
        host: process.env.PGHOST,
        port: process.env.PGPORT,
        user: process.env.PGUSER, // <- This seems like a typo, should be process.env.PGUSER
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        // Add other configuration options as needed
    },
    migrations: {
        directory: './migrations',
    }
    // Add other Knex configuration options as needed
});

module.exports = knex;
