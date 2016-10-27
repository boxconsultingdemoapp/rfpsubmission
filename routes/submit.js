'use strict';
let express = require('express');
let passport = require('passport');
let ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();
let router = express.Router();

let AppConfig = require('../config').AppConfig;
let Auth0Config = require('../config').Auth0Config;
let BoxConfig = require('../config').BoxConfig;

let BoxTools = require('../util/BoxTools');
let Auth0Tools = require('../util/Auth0Tools');

/* GET landing page. */
router.get('/:rfpFolderId', ensureLoggedIn, function (req, res, next) {
	req = Auth0Tools.normalizeAppMetadata(req);
	const rfpFolderId = req.params.rfpFolderId || '0';
	const user = req.user;
	const companyName = "Placeholder Company Name";
	const rfpName = "Placeholder RFP Name";

	req.app.locals.boxAdminApiClient.folders.get('0', null, function(err, response){
		console.log(response);
		//console.log(user);
	});

	res.render('pages/submit', { title: "Placeholder RFP Name Submission", 
		domain: AppConfig.domain, 
		rfpFolderId, 
		rfpName,
		user,
		companyName 
	});

});

module.exports = router;