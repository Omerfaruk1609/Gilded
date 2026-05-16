const Database = require('better-sqlite3');
const path = require('path');
const db = new Database('database.sqlite');
const roles = db.prepare('SELECT DISTINCT role FROM users').all();
console.log(roles);
