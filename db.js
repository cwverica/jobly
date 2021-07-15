"use strict";
/** Database setup for jobly. */
const { Client } = require("pg");
const { getDatabaseUri } = require("./config");

let db;

const { DB_USER, DB_PW } = require("./keys");

if (process.env.NODE_ENV === "production") {
  db = new Client({
    connectionString: `postgres://${DB_USER}:${DB_PW}@localhost:5432/${getDatabaseUri()}`,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  db = new Client({
    connectionString: `postgres://${DB_USER}:${DB_PW}@localhost:5432/${getDatabaseUri()}`
  });
}

db.connect();

module.exports = db;