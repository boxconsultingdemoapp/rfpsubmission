'use strict';

const redis = require('redis');
const RedisConfig = require('../config').RedisConfig;

class BoxRedis {
  constructor() {
    this.redisClient = redis.createClient({port: RedisConfig.port, host: RedisConfig.address, socket_keepalive: true});
    this.redisClient.auth(RedisConfig.password, (err) => {
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



