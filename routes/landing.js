'use strict';
let express = require('express');
let router = express.Router();

let AppConfig = require('../config').AppConfig;

/* GET landing page. */
router.get('/', function (req, res, next) {
	req.app.locals.boxAdminApiClient.folders.get('0', null, function(err, response){
		console.log(response);
	});
	res.render('pages/landing', { title: "Sup", domain: AppConfig.domain });
});

module.exports = router;