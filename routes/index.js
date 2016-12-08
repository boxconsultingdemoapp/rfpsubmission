'use strict';
let express = require('express');
let router = express.Router();
let passport = require('passport');


// require env + user models
require('dotenv').config();

let BoxTools = require('../util/BoxTools');
let Auth0Tools = require('../util/Auth0Tools');
const path = require('path');
const testFileName = process.env.TEST_FILE_NAME;
const testFilePath = path.join(__dirname, '../', process.env.TEST_FILE_NAME);
const testFolderName = process.env.TEST_FOLDER_NAME;

var loginEnv = {
  AUTH0_CLIENT_ID: process.env.OAUTH2_CLIENT_ID,
  AUTH0_DOMAIN: process.env.DOMAIN,
  AUTH0_CALLBACK_URL: process.env.CALLBACK_URL || 'http://localhost:3000/callback'
}

/* GET home page. */
router.get('/', function (req, res, next) {
  res.redirect('/landing')
});

router.get('/login',
  function (req, res) {
    res.render('pages/login', { title: "Box Platform", env: loginEnv, domain: process.env.APP_DOMAIN });
  });

router.get('/logout', function (req, res) {
  // req.session.destroy();
  req.logout();
  res.redirect('/');
});

router.get('/callback',
  passport.authenticate('auth0', { failureRedirect: '/' }),
  function (req, res) {
    if (!('app_metadata' in req.user) || req.user.app_metadata === undefined || !(process.BOX_ID in req.user.app_metadata)) {
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
          return BoxTools.generateUserToken(req.app.locals.BoxSdk, req.user.app_metadata[process.env.BOX_ID])
        })
        .then(function (accessTokenInfo) {
          req.user.boxAccessTokenObject = accessTokenInfo;
          let userClient = req.app.locals.BoxSdk.getBasicClient(accessTokenInfo.accessToken);
          console.log("Setting up new App User's folder...");
          return BoxTools.setupForNewAppUser(userClient, testFileName, testFilePath, testFolderName);
        })
        .then(function (fileData) {
          console.log("Redirecting...");
          if (req.session.returnTo) {
            res.redirect(req.session.returnTo);
          } else {
            res.redirect('/landing');
          }
        })
        .catch(function (err) {
          res.render('pages/error', {
            message: err.message,
            error: err
          });
        });
    } else {
      console.log("Has existing boxId");
      BoxTools.generateUserToken(req.app.locals.BoxSdk, req.user.app_metadata[process.env.BOX_ID])
        .then(function (accessTokenInfo) {
          req.user.boxAccessTokenObject = accessTokenInfo;
          console.log(accessTokenInfo);
          if (req.session.returnTo) {
            res.redirect(req.session.returnTo);
          } else {
            res.redirect('/landing');
          }
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
