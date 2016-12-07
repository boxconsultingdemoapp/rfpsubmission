'use strict';
let express = require('express');
let router = express.Router();
let ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();
let BoxTools = require('../util/BoxTools');

let jwt = require('express-jwt');

// require env + user models
require('dotenv').config();

function retrieveFolderCollection(folderId, boxAdminApiClient) {
  console.log(folderId);
  return new Promise((resolve, reject) => {
    boxAdminApiClient.folders.get(folderId, null, function (err, folder) {
      if (folder && folder.item_collection && folder.item_collection.total_count && folder.item_collection.total_count > 0) {
        resolve(folder.item_collection.entries);
      } else {
        resolve([]);
      }
    });
  });
}

function traverseFolders(folderEntries, boxAdminApiClient) {
  let folderPromises = [];
  folderEntries.forEach((item) => {
    folderPromises.push(new Promise((resolve, reject) => {
      boxAdminApiClient.folders.getMetadata(item.id, 'enterprise', 'TYPE', function (err, response) {
        if (err) {
          console.log(err);
          reject(err);
        }
        if (response && response.TYPE === 'RFP_SUBMISSIONS') {
          console.log(response);
          resolve(item);
        } else if (item.name.toLowerCase().includes("external")) {
          resolve(null);
        }
      });
    }));
  });
  return folderPromises;
}

function findSubmitionFolder(arr, company, boxAdminApiClient) {
  let companySubmissionFolder;
  arr = arr.filter(function (resp) {
    if (resp) {
      return resp;
    }
  });
  arr = (arr.length > 0) ? arr[0] : null;
  console.log("Looking for val");
  console.log(arr);
  return new Promise((resolve, reject) => {
    boxAdminApiClient.folders.get(arr.id, null, function (err, folder) {
      if (folder && folder.item_collection && folder.item_collection.total_count && folder.item_collection.total_count > 0) {
        console.log(folder);
        console.log(folder.item_collection);
        companySubmissionFolder = folder.item_collection.entries.filter((item) => {
          let name = item.name.toLowerCase();
          if (name.includes(company.toLowerCase())) {
            return item;
          }
        });
        companySubmissionFolder = (companySubmissionFolder.length > 0) ? companySubmissionFolder[0] : null;
        resolve({ company: companySubmissionFolder, general: arr });
      }
    });
  });
}

function findOrCreateCompanyFolder(submissionFolders, company, boxAdminApiClient) {
  return new Promise((resolve, reject) => {
    if (submissionFolders.company) {
      boxAdminApiClient.folders.get(submissionFolders.company.id, null, function (err, folder) {
        if (err) {
          reject(err);
        }
        resolve(folder);
      });
    } else {
      let newCompanyFolder = submissionFolders.general.name.split('Submissions')[0].trim();
      newCompanyFolder = newCompanyFolder + " " + company
      let newFolderPromises = [];
      boxAdminApiClient.folders.create(submissionFolders.general.id, newCompanyFolder, function (err, createdCompanyFolder) {
        ["Upload", "Pricing Review", "Technical Review"].forEach((folderType) => {
          let companySubFolder = newCompanyFolder + " " + folderType;
          newFolderPromises.push(new Promise((resolve, reject) => {
            boxAdminApiClient.folders.create(createdCompanyFolder.id, companySubFolder, function (err, folder) {
              if (err) {
                reject(err);
              }
              resolve(folder);
            });
          }));
        });
        Promise.all(newFolderPromises)
          .then((arr) => {
            resolve(arr);
          });
      });
    }
  });
}

function findUploadFolder(companyFolders, boxAdminApiClient) {
  if (!Array.isArray(companyFolders)) {
    if (companyFolders && companyFolders.item_collection && companyFolders.item_collection.entries) {
      companyFolders = companyFolders.item_collection.entries;
    }
  }

  let collaborateOnFolder = companyFolders.filter((eachFolder) => {
    if (eachFolder.name.includes("Upload")) {
      return eachFolder;
    }
  });
  console.log("New Upload Folder");
  collaborateOnFolder = (collaborateOnFolder.length > 0) ? collaborateOnFolder[0] : null;
  console.log(collaborateOnFolder);
  return new Promise((resolve, reject) => {
    if (collaborateOnFolder) {
      console.log("Going to call collab endpoint...")
      return boxAdminApiClient.folders.getCollaborations(collaborateOnFolder.id, null, function (err, response) {
        console.log(response);
        console.log(response.entries);

        resolve({ collaborations: response, collaborateOnUploadFolder: collaborateOnFolder });
      });
    }
    resolve({ collaborations: null, collaborateOnUploadFolder: collaborateOnFolder });
  });
}

function checkForExistingCollab(collaborationResults, boxId) {
  let hasCollaboration = false;
  let existingCollaboration;
  console.log(collaborationResults.collaborations);
  console.log("Collab Results:::");
  console.log(collaborationResults);
  if (collaborationResults.collaborations && collaborationResults.collaborations.total_count && collaborationResults.collaborations.total_count > 0) {

    collaborationResults.collaborations.entries.forEach((collaboration) => {
      if (boxId === collaboration.accessible_by.id) {
        existingCollaboration = collaboration;
        hasCollaboration = true;
      }
    });
    return { hasCollaboration: hasCollaboration, collaborateOnUploadFolder: collaborationResults.collaborateOnUploadFolder, existingCollaboration: existingCollaboration };
  } else {
    return { hasCollaboration: hasCollaboration, collaborateOnUploadFolder: collaborationResults.collaborateOnUploadFolder, existingCollaboration: existingCollaboration };
  }
}

function createCollaborationForAppUser(collaborationResults, boxId, boxAdminApiClient) {
  return new Promise((resolve, reject) => {
    if (!collaborationResults.hasCollaboration) {
      boxAdminApiClient.collaborations.create({ id: boxId, type: "user" }, collaborationResults.collaborateOnUploadFolder.id, "editor", function (err, response) {
        if (err) {
          reject(err);
        }
        resolve(response);
      });
    } else {
      resolve(collaborationResults.existingCollaboration);
    }
  });
}

router.get('/:root', ensureLoggedIn, function (req, res, next) {
  let folderId = req.params.root;
  let boxAdminApiClient = req.app.locals.boxAdminApiClient;
  let submissionFolder;
  let boxId;
  let company;
  let rfpName;

  if (req.user && req.user.app_metadata && req.user.app_metadata[process.env.BOX_ID] && req.user.user_metadata && req.user.user_metadata.Company) {
    boxId = req.user.app_metadata[process.env.BOX_ID];
    company = req.user.user_metadata.Company;
  } else {
    res.redirect('/landing');
  }

  // res.redirect('/landing');
  retrieveFolderCollection(folderId, boxAdminApiClient)
    .then((entries) => {
      console.log("Entries");
      console.log(entries);
      let folderPromises = traverseFolders(entries, boxAdminApiClient);
      console.log("Folder Promises");
      console.log(folderPromises);
      return Promise.all(folderPromises);
    })
    .then((arr) => {
      return findSubmitionFolder(arr, company, boxAdminApiClient);
    })
    .then((submissionFolders) => {
      console.log(submissionFolders);
      return findOrCreateCompanyFolder(submissionFolders, company, boxAdminApiClient)
    })
    .then((companyFolders) => {
      console.log(companyFolders);
      return findUploadFolder(companyFolders, boxAdminApiClient);
    })
    .then((collaborationResults) => {
      console.log("Collab Result");
      collaborationResults = checkForExistingCollab(collaborationResults, boxId);
      console.log(collaborationResults);
      return createCollaborationForAppUser(collaborationResults, boxId, boxAdminApiClient);
    })
    .then((response) => {
      console.log("This is the created collaboration");
      console.log(response);
      if (response && response.item) {
        response = response.item;
      }
      let values = response.name.split(company);
      rfpName = (values.length > 0) ? values[0] : "unknown";
      submissionFolder = response.id;
      return BoxTools.generateUserToken(req.app.locals.BoxSdk, boxId);
    })
    .then((accessTokenInfo) => {
      console.log(req.user);
      res.render('pages/submit', {
        title: "Placeholder RFP Name Submission",
        domain: process.env.APP_DOMAIN,
        accessTokenInfo: accessTokenInfo,
        user: req.user,
        submissionFolder: submissionFolder,
        rfpName: rfpName
      });
    })
    .catch((err) => {
    console.log(err);
  });
});

module.exports = router;
