#!/usr/bin/env node

'use strict';
process.title = 'cloudbridge aar generator';

var fs = require('fs'),
	shelljs = require('shelljs'),
	path = require('path'),
	exec = require('child_process').exec,
	directory = 'C:/dev/src/advtec9/trunk_fat/android-build/',
	BEGIN_QT = '<!-- BEGIN:QT_METADATA -->',
	END_QT = '<!-- END:QT_METADATA -->';

var content = fs.readFileSync(directory + 'AndroidManifest.xml', {encoding: 'utf8'});
var patt = new RegExp(BEGIN_QT + '((.|\n|\r)*?)' + END_QT, "gm");
var qtMeta = patt.exec(content);
var temp = '';

if (qtMeta.length === 3) {
	//trim all lines
	temp = qtMeta[1].replace(/(^\s+)|(\s+$)/gm, '');

	fs.writeFileSync(directory + 'qt_metadata.txt', temp);
}

temp = content.replace(/<application(.|\n|\r)*?<\/application>/gm, '');

fs.writeFileSync(directory + 'AndroidManifest.aar.xml', temp);

var content = fs.readFileSync(directory + 'build.gradle', {encoding: 'utf8'});

content = content.replace(/apply plugin: 'com\.android\.application'/gm,
							'apply plugin: \'com.android.library\'');

content = content.replace(/manifest\.srcFile 'AndroidManifest\.xml'/gm,
							'manifest.srcFile \'AndroidManifest.aar.xml\'');


fs.writeFileSync(directory + 'build.aar.gradle', content);

shelljs.rm('-rf', path.join(directory, 'assets', 'appserver.ini'));
shelljs.rm('-rf', path.join(directory, 'assets', 'smartclient.ini'));
shelljs.rm('-rf', path.join(directory, 'assets', '*.rpo'));

exec(directory + 'gradlew -b build.aar.gradle clean build', {cwd: directory}, function(error, stdout, stderr) {
	if (error) {
		console.error('exec error: ' + error + '\n');
		return;
	}
	console.log('stdout: ' + stdout + '\n');
	console.log('stderr: ' + stderr + '\n');

	var src = path.join(directory, 'build', 'outputs', 'aar');

	shelljs.cp('-Rf',
		path.join(src, 'android-build-debug.aar'),
		path.join(directory, 'com.totvs.smartclient-DEBUG.aar'));

	shelljs.cp('-Rf',
		path.join(src, 'android-build-release.aar'),
		path.join(directory, 'com.totvs.smartclient.aar'));
});
