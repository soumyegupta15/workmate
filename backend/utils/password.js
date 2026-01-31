'use strict';

const bcrypt = require('bcryptjs');

const DEFAULT_SALT_ROUNDS = 10;

async function hashPassword(plainPassword, saltRounds = DEFAULT_SALT_ROUNDS) {
  if (!plainPassword) {
    throw new Error('Password is required for hashing');
  }

  const salt = await bcrypt.genSalt(saltRounds);
  return bcrypt.hash(plainPassword, salt);
}

async function comparePassword(plainPassword, hashedPassword) {
  if (!plainPassword || !hashedPassword) {
    return false;
  }

  return bcrypt.compare(plainPassword, hashedPassword);
}

module.exports = {
  hashPassword,
  comparePassword
};


