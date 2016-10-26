'use strict';
let express = require('express');
let router = express.Router();
let passport = require('passport');

let AppConfig = require('../config').AppConfig;
let BoxConfig = require('../config').BoxConfig;
let Auth0Config = require('../config').Auth0Config;

let BoxTools = require('../util/BoxTools');
let Auth0Tools = require('../util/Auth0Tools');
const path = require('path');
const testFileName = BoxConfig.testFileName;
const testFilePath = path.join(__dirname, '../', testFileName);
const testFolderName = BoxConfig.testFolderName;

var loginEnv = {
  AUTH0_CLIENT_ID: Auth0Config.clientId,
  AUTH0_DOMAIN: Auth0Config.domain,
  AUTH0_CALLBACK_URL: Auth0Config.callbackUrl || 'http://localhost:3000/callback'
}

/* GET home page. */
router.get('/', function (req, res, next) {
  if (req.user) {
    res.redirect('/user');
  }
  res.render('pages/login', { title: "Box Platform", env: loginEnv, domain: AppConfig.domain });
});

router.get('/login',
  function (req, res) {
    res.render('pages/login', { title: "Box Platform", env: loginEnv, domain: AppConfig.domain });
  });

router.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

router.get('/callback',
  passport.authenticate('auth0', { failureRedirect: '/' }),
  function (req, res) {
    if (!('app_metadata' in req.user) || req.user.app_metadata === undefined || !(BoxConfig.boxId in req.user.app_metadata)) {
      console.log("Creating new App User and assigning boxId...");
      BoxTools.createNewAppUser(req.app.locals.boxAdminApiClient, req.user.displayName)
        .then(function (userData) {
          console.log("Now on to Auth0...");
          console.log(userData);
          return Auth0Tools.updateAppMetadata(req.user.id, userData.id);
        })
        .then(function (auth0User) {
          console.log(auth0User);
          req.user.app_metadata = auth0User.app_metadata;
          return BoxTools.generateUserToken(req.app.locals.BoxSdk, req.user.app_metadata[BoxConfig.boxId])
        })
        .then(function (accessTokenInfo) {
          req.user.boxAccessTokenObject = accessTokenInfo;
          let userClient = req.app.locals.BoxSdk.getBasicClient(accessTokenInfo.accessToken);
          console.log("Setting up new App User's folder...");
          return BoxTools.setupForNewAppUser(userClient, testFileName, testFilePath, testFolderName);
        })
        .then(function (fileData) {
          console.log("Redirecting to user page...");
          res.redirect('/user');
        })
        .catch(function (err) {
          res.render('pages/error', {
            message: err.message,
            error: err
          });
        });
    } else {
      console.log("Has existing boxId");
      BoxTools.generateUserToken(req.app.locals.BoxSdk, req.user.app_metadata[BoxConfig.boxId])
        .then(function (accessTokenInfo) {
          req.user.boxAccessTokenObject = accessTokenInfo;
          console.log(accessTokenInfo);
          res.redirect('/user');
        })
        .catch(function (err) {
          res.render('pages/error', {
            message: err.message,
            error: {}
          });
        });
    }
  });

module.exports = router;
