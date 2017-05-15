'use strict';

var request = require('request'),
	_ = require('underscore'),
	Q = require('q'),
	Task = require('./../task');

class StartListTask extends Task {

	fetchStarterTemplates() {
		// console.log('About to fetch template');
		var downloadUrl = 'http://code.cloudbridgeframework.com/content/starter-templates.json';
		//var starterTemplateJsonPath = path.resolve(__dirname, 'starter-templates.json');

		// console.log('\nDownloading Starter Templates'.bold, downloadUrl, starterTemplateJsonPath);
		console.log('\nDownloading Starter Templates'.bold, '-', downloadUrl);

		var q = Q.defer();

		var proxy = process.env.PROXY || null;
		request({ url: downloadUrl, proxy: proxy }, function(err, res, html) {
			if (!err && res && res.statusCode === 200) {
				var templatesJson = {};
				try {
					templatesJson = JSON.parse(html);
				}
				catch (ex) {
					console.log('ex', ex);
					q.reject('Error occured in download templates:', ex);
					cli.utils.fail(ex);
					return;
				}
				q.resolve(templatesJson);
			}
			else {
				console.log('Unable to fetch the starter templates. Please check your internet connection'.red);
				q.reject(res);
			}
		});
		return q.promise;
	}

	list(templates) {
		//Should have array of [{ name: 'name', description: 'desc' }]
		console.log('\n');
		_.each(templates, function(template) {
			var rightColumn = 20, dots = '';
			var shortName = template.name.replace('cloudbridge-template-', '');
			while ((shortName + dots).length < rightColumn + 1) {
				dots += '.';
			}

			console.log(shortName.green, dots, template.description);
		});
	}

	run(cloudbridge) {
		var self = this;

		self.fetchStarterTemplates()
			.then(function(starterTemplates) {
				var templates = _.sortBy(starterTemplates.items, function(template) {
					return template.name;
				});

				console.log('CloudBridge Starter templates'.green);

				self.list(templates);
			});
	}

}

module.exports = StartListTask;
