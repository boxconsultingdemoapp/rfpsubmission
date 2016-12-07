'use strict';
let express = require('express');
let passport = require('passport');
let ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();
let router = express.Router();

let BoxTools = require('../util/BoxTools');

router.get('/thumbnail/:id', ensureLoggedIn, function (req, res) {
  console.log("User from thumbnail call...");
  console.log(req.user);
  console.log(req.user.app_metadata);
  BoxTools.generateUserToken(req.app.locals.BoxSdk, req.user.app_metadata[process.env.BOX_ID])
    .then((accessTokenInfo) => {
      console.log("Retrieved an accessToken");
      let userClient = req.app.locals.BoxSdk.getBasicClient(accessTokenInfo.accessToken);
      // API call to get the thumbnail for a file.  This can return either the
      // specific thumbnail image or a URL pointing to a placeholder thumbnail.
      console.log("Inside the thumbnail request");
      userClient.files.getThumbnail(req.params.id, { min_height: "256", min_width: "256" }, function (err, data) {
        if (err) {
          res.status(err.statusCode || 500).json(err);
          return;
        }

        if (data.file) {
          // We got the thumbnail file, so send the image bytes back
          res.send(data.file);
        } else if (data.location) {
          // We got a placeholder URL, so redirect the user there
          res.redirect(data.location);
        } else {
          // Something went wrong, so return a 500
          res.status(500).end();
        }
      });
    });
});

router.get('/preview/:id', ensureLoggedIn, function (req, res) {
  BoxTools.generateUserToken(req.app.locals.BoxSdk, req.user.app_metadata[process.env.BOX_ID])
    .then((accessTokenInfo) => {
      let userClient = req.app.locals.BoxSdk.getBasicClient(accessTokenInfo.accessToken);
      // The Box file object has a field called "expiring_embed_link", which can
      // be used to embed a preview of the file.  We'll fetch this field only.
      userClient.files.get(req.params.id, { fields: 'expiring_embed_link' }, function (err, data) {

        if (err) {
          res.redirect('/user');
          return;
        }

        res.render('pages/filePreview', {
          file: data
        });
      })
    });
});

router.get('/download/:id', ensureLoggedIn, function (req, res) {
  BoxTools.generateUserToken(req.app.locals.BoxSdk, req.user.app_metadata[process.env.BOX_ID])
    .then((accessTokenInfo) => {
      let userClient = req.app.locals.BoxSdk.getBasicClient(accessTokenInfo.accessToken);
      // API call to get the temporary download URL for the user's file
      userClient.files.getDownloadURL(req.params.id, null, function (err, url) {

        if (err) {
          res.redirect('/user');
          return;
        }

        // Redirect to the download URL, which will cause the user's browser to
        // start the download
        res.redirect(url);
      });
    });
});

module.exports = router;
