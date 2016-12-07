'use strict';
let express = require('express');
let passport = require('passport');
let ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();
let router = express.Router();

// require env + user models
require('dotenv').config();

let loginEnv = {
  AUTH0_CLIENT_ID: process.env.OAUTH2_CLIENT_ID,
  AUTH0_DOMAIN: process.env.DOMAIN,
  AUTH0_CALLBACK_URL: process.env.CALLBACK_URL || 'http://localhost:3000/callback',
  BOX_ID: process.env.BOX_ID
}

let BoxTools = require('../util/BoxTools');
let Auth0Tools = require('../util/Auth0Tools');

/* GET user profile. */
router.get('/:id?', ensureLoggedIn, function (req, res, next) {
  req = Auth0Tools.normalizeAppMetadata(req);
  let rootFolder = req.params.id || '0';

  BoxTools.generateUserToken(req.app.locals.BoxSdk, req.user.app_metadata[process.env.BOX_ID])
    .then(function (accessTokenInfo) {
      let userClient = req.app.locals.BoxSdk.getBasicClient(accessTokenInfo.accessToken);
      userClient.folders.get(rootFolder, null, function (err, folder) {
        let folders = [];
        let files = [];
        let path = [];
        var sequence = 0;
        if (folder && folder.path_collection && folder.path_collection.total_count > 0) {
          folder.path_collection.entries.forEach(function (item) {
            console.log(item);
            if (item.sequence_id === null) {
              sequence = 0;
            } else {
              sequence = parseInt(item.sequence_id) + 1;
              console.log(sequence);
            }
            path[sequence] = {
              name: item.name,
              id: item.id
            }
          });
        }
        path.push({ name: folder.name, id: folder.id });
        console.log(path);
        if (folder && folder.item_collection && folder.item_collection.total_count > 0) {
          folder.item_collection.entries.forEach(function (item) {
            if (item.type === "folder") {
              folders.push(item);
            } else if (item.type === "file") {
              let nameAndExt = item.name.split('.');
              if (nameAndExt.length === 2) {
                item.onlyName = nameAndExt[0];
                item.extension = nameAndExt[1];
              }
              files.push(item);
            }
          });
        }
        console.log(loginEnv);
        res.render('pages/user', {
          user: req.user,
          env: loginEnv,
          baseFolder: folder,
          folders: folders,
          files: files,
          title: "Box Platform",
          path: path,
          domain: process.env.APP_DOMAIN
        });
      });
    });
});

module.exports = router;
