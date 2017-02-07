'use strict';

var plato = require('plato'),
	path = require('path'),
	fs = require('fs');

var __basedir = path.resolve(path.join(__dirname, '..')),
	src = path.resolve(path.join(__basedir, 'src')),
	output = path.resolve(path.join(__basedir, 'build', 'report')),
	options = {
		title: 'CloudBridge JavaScript Source Analysis',
		eslint: JSON.parse(fs.readFileSync(path.join(__basedir, '.jshintrc'), { encoding: 'utf8' })),
		recurse: true
	};


plato.inspect(src, output, options, function(report) {
	console.log("Plato report generation finished!");
});
