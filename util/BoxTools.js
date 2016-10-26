'use strict';
const fs = require('fs');
let BoxTools = function () { };
let BoxRedis = require('./BoxRedis');
let BoxConfig = require('../config').BoxConfig;

BoxTools.prototype.createNewAppUser = function (boxAdminClient, displayName) {
  return new Promise(function (resolve, reject) {
    var requestParams = {
      body: {
        name: displayName,
        is_platform_access_only: true
      }
    };

    boxAdminClient.post('/users', requestParams, boxAdminClient.defaultResponseHandler(function (err, data) {
      if (err) { reject(err) }
      console.log("New App User created!");
      console.log(data);
      resolve(data);
    }));
  });
}

BoxTools.prototype.generateUserToken = (BoxSdk, boxId) => {
  let finalAccessToken;
  return new Promise((resolve, reject) => {
    BoxRedis.getBoxToken(boxId)
      .then((accessTokenFromStorage) => {
        if (accessTokenFromStorage && accessTokenFromStorage[BoxConfig.expiresAt] && accessTokenFromStorage[BoxConfig.expiresAt] > Date.now()) {
          console.log("Found Box App User Token in Redis...");
          resolve(accessTokenFromStorage);
        } else {
          BoxSdk.getAppUserTokens(boxId, (err, accessTokenInfo) => {
            if (err) { reject(err) }
            console.log("Setting access token...");
            console.log(accessTokenInfo);
            finalAccessToken = createExpiresAtProp(accessTokenInfo);
            let expiryTimeInSeconds = getExpirationTimeForRedis(finalAccessToken);
            BoxRedis.setBoxToken(boxId, finalAccessToken, expiryTimeInSeconds)
              .then(() => {
                console.log("Setting Box App User Token in Redis...");
                resolve(finalAccessToken);
              })
              .catch((err) => {
                reject(err);
              });
          });
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
}

BoxTools.prototype.createExpiresAtProp = createExpiresAtProp;

BoxTools.prototype.getExpirationTimeForRedis = getExpirationTimeForRedis;

BoxTools.prototype.setupForNewAppUser = function (boxUserClient, testFileName, testFilePath, testFolderName) {
  return new Promise(function (resolve, reject) {
    console.log("Creating folder...");
    boxUserClient.folders.create('0', testFolderName, function (err, folder) {
      if (err) { reject(err) }
      console.log("Folder created!");
      let file = fs.readFileSync(testFilePath);
      console.log("Read file...");
      boxUserClient.files.uploadFile('0', testFileName, file, function (err, file) {
        console.log("File uploaded!");
        console.log(err);
        console.log(file);
        if (err) { reject(err) }
        resolve(file);
      });
    });
  });
}

BoxTools.prototype.createEnterpriseToken = function (BoxRedis, BoxSdk) {
  return new Promise((resolve, reject) => {
    BoxRedis.getBoxToken(BoxConfig.enterprise)
      .then((enterpriseToken) => {
        console.log(enterpriseToken);
        if (enterpriseToken && enterpriseToken[BoxConfig.expiresAt] && enterpriseToken[BoxConfig.expiresAt] > Date.now()) {
          console.log("Found existing Box Enterprise Token...");
          resolve(BoxSdk.getBasicClient(enterpriseToken.accessToken)); Î
        } else {
          BoxSdk.getEnterpriseAppAuthTokens(BoxConfig.enterpriseId, (err, enterpriseToken) => {
            if (err) { reject(err); }
            console.log("Generated new Enterprise Token:");
            console.log(enterpriseToken);
            console.log("Call to internal function");
            enterpriseToken = this.createExpiresAtProp(enterpriseToken);
            console.log(enterpriseToken);
            let expiryTime = this.getExpirationTimeForRedis(enterpriseToken);
            BoxRedis.setBoxToken(BoxConfig.enterprise, enterpriseToken, expiryTime)
              .then(() => {
                resolve(BoxSdk.getBasicClient(enterpriseToken.accessToken));
              });
          });
        }
      });
  });
}

function createExpiresAtProp(accessTokenInfo) {
  console.log("Creating ExpiresAt prop");
  if (accessTokenInfo && (accessTokenInfo.expires_in || accessTokenInfo.accessTokenTTLMS)) {
    accessTokenInfo[BoxConfig.expiresAt] = (accessTokenInfo.expires_in) ? Date.now() + (accessTokenInfo.expires_in * 1000) : Date.now() + accessTokenInfo.accessTokenTTLMS;
  }
  return accessTokenInfo;
}

function getExpirationTimeForRedis(accessTokenInfo) {
  return Math.ceil((new Date(accessTokenInfo[BoxConfig.expiresAt]) - (Date.now() - 420000)) / 1000);
}

module.exports = new BoxTools();