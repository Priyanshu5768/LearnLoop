require('dotenv').config();
const Bull = require('bull');

const notificationQueue = new Bull('skill-notifications', {
  redis: {
    host: 'valid-mouse-149912.upstash.io',
    port: 6379,
    password: process.env.REDIS_PASSWORD,
    tls: {
      rejectUnauthorized: false
    }
  }
});

module.exports = notificationQueue;