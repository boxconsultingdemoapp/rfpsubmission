'use strict';
let express = require('express');
let passport = require('passport');
let ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();
let router = express.Router();

let AppConfig = require('../config').AppConfig;
let Auth0Config = require('../config').Auth0Config;
let BoxConfig = require('../config').BoxConfig;
let loginEnv = {
  AUTH0_CLIENT_ID: Auth0Config.clientId,
  AUTH0_DOMAIN: Auth0Config.domain,
  AUTH0_CALLBACK_URL: Auth0Config.callbackUrl || 'http://localhost:3000/callback',
  BOX_ID: BoxConfig.boxId
}

let BoxTools = require('../util/BoxTools');
let Auth0Tools = require('../util/Auth0Tools');

/* GET user profile. */
router.get('/:id?', ensureLoggedIn, function (req, res, next) {
  req = Auth0Tools.normalizeAppMetadata(req);
  let rootFolder = req.params.id || '0';

  BoxTools.generateUserToken(req.app.locals.BoxSdk, req.user.app_metadata[BoxConfig.boxId])
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
          domain: AppConfig.domain
        });
      });
    });
});

module.exports = router;
