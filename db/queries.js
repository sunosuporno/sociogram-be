const Pool = require("pg").Pool;
require("dotenv").config();

const user = process.env.DATABASE_USER;
const password = process.env.PASSWORD;
const host = process.env.HOST;
const database = process.env.DATABASE;
const port = process.env.DATABASE_PORT;

const pool = new Pool({
  user: user,
  password: password,
  host: host,
  database: database,
  port: port,
});

module.exports = pool;
