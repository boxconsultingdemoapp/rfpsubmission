'use strict';
let express = require('express');
let router = express.Router();
let AppConfig = require('../config').AppConfig;

router.get('/', function (req, res, next) {
  let landingPageModel = {};
  landingPageModel.rfpAndParent = [];
  let search = '/search?mdfilters=[{"templateKey":"STATUS", "scope":"enterprise", "filters":{"STATUS": "OPEN"}}]';
  req.app.locals.boxAdminApiClient.get(search, null, function (err, openRfps) {
    let externalFolderId = "";
    console.log(err);
    if (openRfps && openRfps.body.total_count && openRfps.body.total_count > 0) {
      landingPageModel.entries = openRfps.body.entries;
      openRfps.body.entries.forEach((rfp) => {
        if (rfp.type === 'file') {
          console.log(rfp);
          if (rfp.parent && rfp.parent.id) {
            landingPageModel.rfpAndParent.push({
              name: rfp.name,
              parentId: rfp.parent.id,
              description: rfp.description
            });
          }
        }
      });
    }
    res.render('pages/landing', { title: "Box Platform", domain: AppConfig.domain, landingPageModel: landingPageModel });
  });
});

module.exports = router;