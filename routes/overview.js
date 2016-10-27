'use strict';
let express = require('express');
let router = express.Router();
let AppConfig = require('../config').AppConfig;

router.get('/:id', function (req, res, next) {
	let folderId = req.params.id;
	let pdf;
	let parent;
	let createdAt;
	req.app.locals.boxAdminApiClient.folders.get(folderId, {fields: "size,item_collection,name,created_at,parent"}, function (err, folder) {
		console.log(folder);
		createdAt = formatDate(new Date(folder.created_at));
		if (folder && folder.item_collection && folder.item_collection.total_count && folder.item_collection.total_count > 0) {
			if (folder.parent && folder.parent.id) {
				parent = folder.parent.id;
			}
			let packages = folder.item_collection.entries.filter((item) => {
				console.log(item);
				let extension = item.name.split('.');
				extension = (extension.length > 1) ? extension[1] : null
				if (extension && extension === 'zip') {
					item.created_at = formatDate(new Date(item.created_at));
					item.size = Math.ceil(Math.ceil(item.size / 1024) / 1024); 
					return item;
				} else if (extension && extension === 'pdf') {
					pdf = item;
				}
			});
			req.app.locals.boxAdminApiClient.files.get(pdf.id, { fields: 'expiring_embed_link' }, function (err, data) {
				res.render('pages/overview', { title: "Box Platform", createdAt: createdAt, domain: AppConfig.domain, packages: packages, pdf: pdf, previewLink: data.expiring_embed_link.url, parentId: parent });
			});
		} else {
			// res.redirect('/landing');
		}
	});
});

router.get('/download/:id', function (req, res) {
	req.app.locals.boxAdminApiClient.files.getDownloadURL(req.params.id, null, function (err, url) {

		if (err) {
			res.render('pages/error', err);
		}

		// Redirect to the download URL, which will cause the user's browser to
		// start the download
		res.redirect(url);
	});
});

function formatDate(date) {
	var daysOfWeek = [
		"Sunday", "Monday",
		"Tuesday", "Wednesday",
		"Thursday", "Friday",
		"Saturday"
	];
	var monthNames = [
		"January", "February", "March",
		"April", "May", "June", "July",
		"August", "September", "October",
		"November", "December"
	];
	var dayOfWeekIndex = date.getDay();
	var monthIndex = date.getMonth();
	var dayOfWeek = daysOfWeek[dayOfWeekIndex];
	var month = monthNames[monthIndex];
	var dateOfMonth = date.getDate();
	var year = date.getFullYear();
	var hours = date.getHours();
	hours++;
	var convertedHours = (hours > 12) ? hours - 12 : hours;
	var amOrPm = ((hours) >= 12) ? "PM" : "AM";
	var minutes = date.getMinutes();
	return month + " " + dateOfMonth + ", " + year;
}

module.exports = router;