'use strict';
let Auth0Config = require('../config').Auth0Config;
let BoxConfig = require('../config').BoxConfig;

let ManagementClient = require('auth0').ManagementClient;
let management = new ManagementClient({
  token: Auth0Config.apiToken,
  domain: Auth0Config.domain
});

let AuthenticationClient = require('auth0').AuthenticationClient;
let authentication = new AuthenticationClient({
  domain: Auth0Config.domain,
  clientId: Auth0Config.clientId
});

let Auth0Tools = function () { };

// Used to normalize a weird JSON structure in Auth0's response
Auth0Tools.prototype.normalizeAppMetadata = function (profile) {
  if ('_json' in profile && 'app_metadata' in profile._json && BoxConfig.boxId in profile._json.app_metadata) {
    console.log("Normalizing user object...");
    profile.app_metadata = {};
    profile.app_metadata[BoxConfig.boxId] = profile._json.app_metadata[BoxConfig.boxId];
  }
  return profile;
}

Auth0Tools.prototype.updateAppMetadata = function (auth0UserId, boxAppUserId) {
  return new Promise(function (resolve, reject) {
    console.log("Updating Auth0 app_metadata...");
    var params = { id: auth0UserId };
    var metadata = {};
    metadata[BoxConfig.boxId] = boxAppUserId
    management.updateAppMetadata(params, metadata, function (err, user) {
      if (err) { reject(err) }
      console.log("Auth0 app_metadata updated!");
      resolve(user);
    });
  });
}

Auth0Tools.prototype.checkIdentityFromIdToken = (auth0IdToken) => {
  return new Promise((resolve, reject) => {
    authentication.tokens.getInfo(auth0IdToken)
      .then((profile) => {
        resolve(profile);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

Auth0Tools.prototype.checkForExistingBoxIdOnAppMetadata = (profile) => {
  if (profile && profile.app_metadata && profile.app_metadata[BoxConfig.boxId]) {
    return profile.app_metadata[BoxConfig.boxId];
  } else {
    return null;
  }
}

module.exports = new Auth0Tools();