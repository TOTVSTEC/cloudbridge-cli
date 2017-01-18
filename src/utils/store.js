'use strict';

var fs = require('fs'),
	path = require('path');

class CloudBridgeStore {

	constructor(fileName) {
		this.data = {};

		if (!fileName) return this;

		this.fileName = fileName;
		if (fileName.indexOf('.') < 0) {
			this.fileName += '.data';
		}

		this.homeDir = process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH;

		this.privateDir = path.join(this.homeDir, '.cloudbridge');

		if (!fs.existsSync(this.privateDir)) {
			fs.mkdirSync(this.privateDir);
		}

		this.filePath = path.join(this.privateDir, this.fileName);

		try {
			this.data = JSON.parse(fs.readFileSync(this.filePath));
		}
		catch (e) { }

		return this;
	}

	get(k) {
		if (k) {
			return this.data[k];
		}
		return this.data;
	}

	set(k, v) {
		this.data[k] = v;
	}

	remove(k) {
		delete this.data[k];
	}

	save() {
		try {
			var dataStoredAsString = JSON.stringify(this.data, null, 2);
			fs.writeFileSync(this.filePath, dataStoredAsString);
			this.data = JSON.parse(dataStoredAsString);
		}
		catch (e) {
			console.error('Unable to save cloudbridge data:', this.filePath, e);
		}
	}

}

exports.CloudBridgeStore = CloudBridgeStore;
