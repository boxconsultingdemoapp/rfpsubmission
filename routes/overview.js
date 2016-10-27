'use strict';
let express = require('express');
let router = express.Router();

let AppConfig = require('../config').AppConfig;

/* GET overview page. */
router.get('/', function (req, res, next) {
	req.app.locals.boxAdminApiClient.folders.get('0', null, function(err, response){
		console.log(response);
	});
	res.render('pages/overview', { title: "RFP", domain: AppConfig.domain });
});

module.exports = router;