'use strict';

const redis = require('redis');
// require env + user models
require('dotenv').config();

class BoxRedis {
  constructor() {
    this.redisClient = redis.createClient({port: process.env.REDIS_PORT, host: process.env.REDIS_URL, socket_keepalive: true});
    this.redisClient.auth(process.env.REDIS_PASSWORD, (err) => {
      if (err) { throw err; }
    });
  }

  getBoxToken(key) {
    return new Promise((resolve, reject) => {
    this.redisClient.get(key, function (err, boxToken) {
      console.log("running get command for redis...");
        console.log("getting box token...");
        if (err) { reject(err); }
        boxToken = (boxToken) ? JSON.parse(boxToken) : null;
        resolve(boxToken);
      });
    });
  };

  setBoxToken(key, boxToken, expiration) {
    return new Promise((resolve, reject) => {
      expiration = expiration || 3600
      boxToken = JSON.stringify(boxToken);
      this.redisClient.set(key, boxToken, 'ex', expiration);
      resolve();
    });
  };
}

module.exports = new BoxRedis;
