var fs = require('fs'),
	path = require('path'),
	shelljs = require('shelljs'),
	os = require('os'),
	argv = require('optimist').argv,
	semver = require('semver'),
	logging = require('./logging');

var Info = module.exports;

var requirements = {
	node: '>=0.12.x',
	cordova: '>=4.2.0'
};

Info.getMacInfo = function getMacInfo() {
	//Need to get:
	//Look up for what version (Yosemite, Mavericks, Mountain Lion)
	//What version of Xcode
	var macVersion = 'El Capitan';
	switch (os.release().split('.')[0]) {
		case '15':
			macVersion = 'El Capitan';
			break;
		case '14':
			macVersion = 'Yosemite';
			break;
		case '13':
			macVersion = 'Mavericks';
			break;
		case '12':
			macVersion = 'Mountain Lion';
			break;
		case '11':
			macVersion = 'Lion';
			break;
		case '10':
			macVersion = 'Snow Leopard';
			break;
	}

	return 'Mac OS X ' + macVersion;
	// logging.logger.info('Mac OS X', macVersion);
};

Info.getCordovaInfo = function getCordovaInfo(info) {
	var command = 'cordova -v';
	var result = shelljs.exec(command, { silent: true });
	if (result.code != 0) {
		info.cordova = 'Not installed';
		return;
	}

	info.cordova = result.output.replace('\n', '');
};

Info.getXcodeInfo = function getXcodeInfo() {
	var result = shelljs.exec('/usr/bin/xcodebuild -version', { silent: true });
	if (result.code != 0) {
		return 'Not installed';
	}
	var version = result.output.replace(/\n/g, ' ');
	return version;
};

Info.getIosSimInfo = function getIosSimInfo() {
	var result = shelljs.exec('ios-sim --version', { silent: true });
	if (result.code != 0) {
		return 'Not installed';
	}
	var version = result.output.replace(/\n/g, ' ');
	return version;
};

Info.getIosDeployInfo = function getIosDeployInfo() {
	var result = shelljs.exec('ios-deploy --version', { silent: true });
	if (result.code != 0) {
		return 'Not installed';
	}
	var version = result.output.replace(/\n/g, ' ');
	return version;
};

Info.getCloudBridgeCliVersion = function getCloudBridgeCliVersion(info, cloudbridgeCliPath) {
	try {
		var cloudbridgeCliPackageJsonPath = path.join(cloudbridgeCliPath, 'package.json');
		var cloudbridgeCliPackageJson = require(cloudbridgeCliPackageJsonPath);
		info.cloudbridge_cli = cloudbridgeCliPackageJson.version;
	}
	catch (ex) { }
};

Info.getCloudBridgeLibVersion = function getCloudBridgeLibVersion(info) {
	try {
		var packageJson = require(path.resolve(__dirname, '../package.json'));
		var cloudbridgeLibVersion = packageJson.version;

		info.cloudbridge_lib = cloudbridgeLibVersion;
	}
	catch (ex) { }
};

Info.getCloudBridgeVersion = function getCloudBridgeVersion(info, appDirectory) {
	try {
		var cloudbridgeVersionFile = require(path.join(appDirectory, 'www/lib/cloudbridge/version.json'));
		var cloudbridgeVersion = cloudbridgeVersionFile.version;
		info.cloudbridge = cloudbridgeVersion;
	}
	catch (ex) { }

	try {
		var bowerJsonPath = path.join(appDirectory, 'www', 'lib', 'cloudbridge', 'bower.json');
		var cloudbridgePackageJson = require(bowerJsonPath);
		var cloudbridgeVersion = cloudbridgePackageJson.version;
		info.cloudbridge = cloudbridgeVersion;
	}
	catch (ex) { }

};

// Windows XP  5.1.2600
// Windows Server 2003 5.2.3790
// Windows Vista
// Windows Server 2008 6.0.6000
// Windows Vista, SP2  6.0.6002
// Windows 7
// Windows Server 2008 R2  6.1.7600
// Windows 7 SP1
// Windows Server 2008 R2 SP1  6.1.7601
// Windows 8
// Windows Server 2012 6.2.9200
// Windows 8.1
// Windows Server 2012 R2  6.3.9600
// Windows 10 Technical Preview  6.4.9841

Info.getWindowsEnvironmentInfo = function getWindowsEnvironmentInfo() {
	// Windows version reference
	// http://en.wikipedia.org/wiki/Ver_%28command%29
	var version = os.release();
	var windowsVersion = null;
	switch (version) {
		case '5.1.2600':
			windowsVersion = 'Windows XP';
			break;
		case '6.0.6000':
			windowsVersion = 'Windows Vista';
			break;
		case '6.0.6002':
			windowsVersion = 'Windows Vista SP2';
			break;
		case '6.1.7600':
			windowsVersion = 'Windows 7';
			break;
		case '6.1.7601':
			windowsVersion = 'Windows 7 SP1';
			break;
		case '6.2.9200':
			windowsVersion = 'Windows 8';
			break;
		case '6.3.9600':
			windowsVersion = 'Windows 8.1';
			break;
		default:
			if (version.substring(0, 4) === '10.0') {
				windowsVersion = 'Windows 10';
				break;
			}
	}

	return windowsVersion;
};

Info.getLinuxEnvironmentInfo = function getLinuxEnvironmentInfo() {
	var result = shelljs.exec('lsb_release -id', { silent: true });
	return result.output.replace(/\n/g, ' ');
};

//http://stackoverflow.com/questions/6551006/get-my-os-from-the-node-js-shell
Info.getOsEnvironment = function getOsEnvironment(info) {
	switch (os.type()) {
		case 'Darwin':
			info.os = Info.getMacInfo();
			info.xcode = Info.getXcodeInfo();
			info.ios_sim = Info.getIosSimInfo();
			info.ios_deploy = Info.getIosDeployInfo();
			break;
		case 'Windows_NT':
			info.os = Info.getWindowsEnvironmentInfo();
			break;
		case 'Linux':
			info.os = Info.getLinuxEnvironmentInfo();
			break;
	}
};

Info.getNodeVersion = function getNodeVersion(info) {
	info.node = process.version;
	// var command = 'node -v';
	// var result = shelljs.exec(command, { silent: true } );
	// info.node = result.output.replace('\n','');
};

Info.gatherGulpInfo = function gatherGulpInfo(info) {
	var result = shelljs.exec('gulp -v', { silent: true });

	try {
		if (result.code == 0) {
			// console.log(result.output);
			var gulpVersions = result.output.replace(/(\[.*\])/g, '').split('\n');
			if (gulpVersions.length > 0) {
				info.gulp = gulpVersions[0];
				info.gulp_local = gulpVersions[1];
			}
		}
	}
	catch (ex) {

	}
};

Info.gatherInfo = function gatherInfo() {
	var info = {};
	//For macs we want:
	//Mac version, xcode version (if installed)

	//For windows
	//Windows version

	//For all
	// Android SDK info
	// Cordova CLI info
	// CloudBridge CLI version
	// CloudBridge version

	// var info = {
	//   cordova: 'CLI v3.5.0',
	//   os: 'Mac OSX Yosemite',
	//   xcode: 'Xcode 6.1.1',
	//   cloudbridge: '1.0.0-beta.13',
	//   cloudbridge_cli: '1.3.0'
	// };

	Info.getCloudBridgeLibVersion(info);

	Info.getNodeVersion(info);

	Info.getOsEnvironment(info);

	Info.getCordovaInfo(info);

	Info.gatherGulpInfo(info);

	return info;
};

Info.printInfo = function printInfo(info) {
	logging.logger.info('\nYour system information:\n');

	logging.logger.info('Cordova CLI:', info.cordova);
	if (info.gulp) {
		logging.logger.info('Gulp version:', info.gulp);
		logging.logger.info('Gulp local: ', info.gulp_local);
	}

	if (info.cloudbridge) {
		logging.logger.info('CloudBridge Framework Version:', info.cloudbridge);
	}

	if (info.cloudbridge_cli) {
		logging.logger.info('CloudBridge CLI Version:', info.cloudbridge_cli);
	}

	if (info.cloudbridge_lib) {
		logging.logger.info('CloudBridge App Lib Version:', info.cloudbridge_lib);
	}

	if (info.ios_deploy) {
		logging.logger.info('ios-deploy version:', info.ios_deploy);
	}

	if (info.ios_sim) {
		logging.logger.info('ios-sim version:', info.ios_sim);
	}

	logging.logger.info('OS:', info.os);
	logging.logger.info('Node Version:', info.node);

	if (info.xcode) {
		logging.logger.info('Xcode version:', info.xcode);
	}

	logging.logger.info('\n');
};

Info.checkRuntime = function checkRuntime() {
	var info = this.gatherInfo(),
		iosDeployInstalled = false,
		iosSimInstalled = false,
		cordovaInstalled = false,
		cordovaUpgrade = false,
		nodeUpgrade = false,
		validRuntime = true;

	try {
		nodeUpgrade = !semver.satisfies(info.node, requirements.node);
		cordovaUpgrade = !semver.satisfies(info.cordova, requirements.cordova);
		cordovaInstalled = true; //if it throws above, we know cordova is not installed
	}
	catch (ex) {
	}

	logging.logger.debug('System Info:', info);

	if (info.ios_sim !== 'Not installed') {
		iosSimInstalled = true;
	}
	if (info.ios_deploy !== 'Not installed') {
		iosDeployInstalled = true;
	}

	var checkOsx = process.platform === 'darwin';

	var checkOsxDeps = checkOsx && (!iosSimInstalled || !iosDeployInstalled);

	// console.log('nodeUpgrade', nodeUpgrade, 'cordovaUpgrade', cordovaUpgrade, 'cordovaInstalled', cordovaInstalled);
	var showDepdencyWarning = nodeUpgrade || (!cordovaInstalled || cordovaUpgrade) || checkOsxDeps;

	if (showDepdencyWarning) {
		logging.logger.info('******************************************************'.red.bold);
		logging.logger.info(' Dependency warning - for the CLI to run correctly,	  '.red.bold);
		logging.logger.info(' it is highly recommended to install/upgrade the following:	 '.red.bold);
		logging.logger.info('');

		if (nodeUpgrade) {
			var updateMessage = [' Please update your Node runtime to version ', requirements.node].join(' ');
			logging.logger.info(updateMessage.red.bold);
			validRuntime = false;
		}

		/*
		if (!cordovaInstalled || cordovaUpgrade) {
			var action = cordovaInstalled ? 'update' : 'install';
			var updateMessage = [' Please', action, 'your Cordova CLI to version ', requirements.cordova, '`npm install -g cordova`'].join(' ');
			logging.logger.info(updateMessage.red.bold);
			validRuntime = false;
		}
		*/

		if (info.ios_sim === 'Not installed') {
			logging.logger.info(' Install ios-sim to deploy iOS applications. `npm install -g ios-sim` (may require sudo)'.red.bold);
		}
		if (info.ios_deploy === 'Not installed') {
			logging.logger.info(' Install ios-deploy to deploy iOS applications to devices. `npm install -g ios-deploy` (may require sudo)'.red.bold);
		}

		logging.logger.info('');
		logging.logger.info('******************************************************'.red.bold);
	}

	return validRuntime;
};

Info.run = function run(cloudbridge) {

	var info = Info.gatherInfo();
	Info.printInfo(info);

	Info.checkRuntime();

};
