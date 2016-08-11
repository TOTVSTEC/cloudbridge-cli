var Updates = module.exports,
	request = require('request'),
	semver = require('semver'),
	Q  = require('q'),
	Info = cb_require('utils/info'),
	CloudBridgeStore = cb_require('utils/store').CloudBridgeStore,
	CloudBridgeConfig = new CloudBridgeStore('cloudbridge.config');


Updates.checkLatestVersion = function checkLatestVersion() {
	cli.latestVersion = Q.defer();

	try {
		if (settings.version.indexOf('beta') > -1) {
			// don't bother checking if its a beta
			cli.latestVersion.resolve();
			return;
		}

		var versionCheck = CloudBridgeConfig.get('versionCheck');
		if (versionCheck && ((versionCheck + 86400000) > Date.now())) {
			// we've recently checked for the latest version, so don't bother again
			cli.latestVersion.resolve();
			return;
		}

		var proxy = process.env.PROXY || process.env.http_proxy || null;

		request({
				url: 'http://registry.npmjs.org/cloudbridge/latest',
				proxy: proxy
			},
			function(err, res, body) {
				try {
					cli.npmVersion = JSON.parse(body).version;
					CloudBridgeConfig.set('versionCheck', Date.now());
					CloudBridgeConfig.save();
				}
				catch (e) {

				}

				cli.latestVersion.resolve();
			}
		);
	}
	catch (e) {
		cli.latestVersion.resolve();
	}

	return cli.latestVersion.promise;
};

Updates.doRuntimeCheck = function doRuntimeCheck(version) {
	var lastVersionChecked = CloudBridgeConfig.get('lastVersionChecked');
	var versionHasBeenChecked;

	try {
		versionHasBeenChecked = semver.satisfies(version, lastVersionChecked);
	}
	catch (ex) {
		console.log(ex);
	}

	if (!lastVersionChecked || !versionHasBeenChecked) {
		Info.checkRuntime();
		CloudBridgeConfig.set('lastVersionChecked', version);
		CloudBridgeConfig.save();
	}
};
