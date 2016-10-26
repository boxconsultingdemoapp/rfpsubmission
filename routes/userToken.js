'use strict';
let express = require('express');
let router = express.Router();
let jwt = require('express-jwt');

let Auth0Config = require('../config').Auth0Config;
let BoxConfig = require('../config').BoxConfig;

let Auth0Tools = require('../util/Auth0Tools');
let BoxTools = require('../util/BoxTools');

router.use(jwt({
  secret: new Buffer(Auth0Config.clientSecret, 'base64'),
  audience: Auth0Config.clientId
}));

router.get('/', function (req, res, next) {
  console.log(req.headers.authorization);
  let authCode = req.headers.authorization.replace("Bearer ", "");
  let boxId;
  Auth0Tools.checkIdentityFromIdToken(authCode)
    .then((profile) => {
      console.log("Found profile...");
      console.log(profile);
      boxId = Auth0Tools.checkForExistingBoxIdOnAppMetadata(profile);
      if (!boxId) { throw new Error("No App User ID present on this user."); }
      return BoxTools.generateUserToken(req.app.locals.BoxSdk, boxId);
    })
    .then(function (accessTokenInfo) {
      console.log("Refreshing access token");
      console.log(accessTokenInfo);
      res.status(200);
      res.json(accessTokenInfo);
    })
    .catch(function (err) {
      res.status(err.code || 500);
      res.json(err);
    });
});

module.exports = router;