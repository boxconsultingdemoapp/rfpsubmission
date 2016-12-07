'use strict';
// require env + user models
require('dotenv').config();

let ManagementClient = require('auth0').ManagementClient;
let management = new ManagementClient({
  token: process.env.API_TOKEN,
  domain: process.env.DOMAIN
});

let AuthenticationClient = require('auth0').AuthenticationClient;
let authentication = new AuthenticationClient({
  domain: process.env.DOMAIN,
  clientId: process.env.OAUTH2_CLIENT_ID
});

let Auth0Tools = function () { };

// Used to normalize a weird JSON structure in Auth0's response
Auth0Tools.prototype.normalizeMetadata = function (profile) {
  if ('_json' in profile && 'app_metadata' in profile._json && process.env.BOX_ID in profile._json.app_metadata) {
    console.log("Normalizing user object...");
    profile.app_metadata = {};
    profile.app_metadata[process.env.BOX_ID] = profile._json.app_metadata[process.env.BOX_ID];
  }
  if ('_json' in profile && 'user_metadata' in profile._json) {
    console.log("Normalizing user object...");
    profile.user_metadata = profile._json.user_metadata;
  }
  return profile;
}

Auth0Tools.prototype.updateAppMetadata = function (auth0UserId, boxAppUserId) {
  return new Promise(function (resolve, reject) {
    console.log("Updating Auth0 app_metadata...");
    var params = { id: auth0UserId };
    var metadata = {};
    metadata[process.env.BOX_ID] = boxAppUserId
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
  if (profile && profile.app_metadata && profile.app_metadata[process.env.BOX_ID]) {
    return profile.app_metadata[process.env.BOX_ID];
  } else {
    return null;
  }
}

module.exports = new Auth0Tools();
