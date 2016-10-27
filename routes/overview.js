'use strict';
let express = require('express');
let router = express.Router();

let AppConfig = require('../config').AppConfig;
let BoxConfig = require('../config').BoxConfig;

/* GET overview page. */
router.get('/', function (req, res, next) {
	req.app.locals.boxAdminApiClient.folders.get('0', null, function(err, response){
		console.log(response);
	});
	// boxClient.files.getEmbedLink({ id: fileId })
	res.render('pages/overview', { title: "RFP", domain: AppConfig.domain });
});

module.exports = router;