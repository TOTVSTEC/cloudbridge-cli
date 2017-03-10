'use strict';

let path = require('path'),
    BuildTask = cb_require('tasks/build'),
    pathUtils = cb_require('utils/paths'),
    fileUtils = cb_require('utils/file'),
    shelljs = require('shelljs'),
    Q = require('q'),
    AdvplCompileTask = cb_require('tasks/advpl-compile');

let /*ANDROID_KEY = pathUtils.get('ANDROID_SRC'),*/
    RPO_KEY = pathUtils.get('RPO_SRC'),
    WEB_KEY = pathUtils.get('WEB_SRC'),
    BOWER_KEY = path.join('build', 'bower'),
    /*ANDROID_SRC,*/
    RPO_SRC,
    WEB_SRC;

class BuildIosTask extends BuildTask {

    constructor(options) {
        super(options);

        //ANDROID_SRC = path.join(this.projectDir, ANDROID_KEY);
        RPO_SRC = path.join(this.projectDir, RPO_KEY);
        WEB_SRC = path.join(this.projectDir, WEB_KEY);
    }

    run(cloudbridge, argv) {
        let forceClean = this.needClean(argv),
            task = new AdvplCompileTask(this.options),
            promise = task.run(cloudbridge, argv);

        return promise
            .then(() => {
                if (forceClean)
                    return this.clean();
            })
            .then(() => {
                return this.prepare();
            })
            .then(() => {
                return this.assemble();
            })
            .then((modified) => {
                if (!modified)
                    return;

                return this.build()
                    .then(() => {
                        return this.finish();
                    });
            });
    }

    needClean(argv) {
        if (argv.clean || argv.c)
            return true;

        if (fileUtils.platformChanged(this.projectDir, 'ios'))
            return true;

        return false;
    }

    clean() {
        var iosKitDir = path.join(this.projectDir, 'src', 'ios'),
            iosXcodeprjDir = path.join(iosKitDir, this.project.data().name + '.xcodeproj'),
            stagingDir = path.join(iosKitDir, 'build'),
            apps = path.join(stagingDir, 'Relase-iphoneos', this.project.data().name + '.app');

        shelljs.exec('/usr/bin/xcodebuild -project ' + iosXcodeprjDir + ' clean')
        shelljs.rm('-rf', apps);
        shelljs.rm('-rf', stagingDir);

    }

    prepare() {
        // let iosBuild = path.join(this.projectDir, 'src', 'ios'),
        // 	stagingDir = path.join(iosBuild, 'build'),
        var webDir = path.join(this.projectDir, 'build', 'ios', 'assets', 'web');

        // if (!shelljs.test('-d', stagingDir)) {
        // 	shelljs.mkdir('-p', stagingDir);
        shelljs.mkdir('-p', webDir);

        //shelljs.cp('-Rf', path.join(androidBuild, 'gradlew'), stagingDir);
        //shelljs.cp('-Rf', path.join(androidBuild, 'gradlew.bat'), stagingDir);
        //shelljs.cp('-Rf', path.join(androidBuild, 'gradle'), stagingDir);
        //shelljs.cp('-Rf', path.join(this.project.name, 'build', 'ios', 'assets'), stagingDir);
        //shelljs.cp('-Rf', path.join(androidBuild, 'libs'), stagingDir);

        fileUtils.savePlatformVersion(this.projectDir, 'ios');
        //}
    }

    assemble() {
        // var androidBuild = path.join(this.projectDir, 'build', 'android'),
        // 	bowerDir = path.join(this.projectDir, 'build', 'bower'),
        // 	stagingDir = path.join(androidBuild, 'staging'),
        // 	assetsDir = path.join(stagingDir, 'assets'),
        // 	webDir = path.join(assetsDir, 'web'),
        var webDir = path.join(this.projectDir, 'build', 'ios', 'assets', 'web'),
            assetsDir = path.join(this.projectDir, 'build', 'ios', 'assets'),
            bowerDir = path.join(this.projectDir, 'build', 'bower'),
            modified = false;

        //modified |= this.copyModifiedFiles(ANDROID_SRC, stagingDir, ANDROID_KEY);
        modified |= this.copyModifiedFiles(WEB_SRC, webDir, WEB_KEY);
        modified |= this.copyModifiedFiles(RPO_SRC, assetsDir, RPO_KEY);

        //TODO: verificar bower
        modified |= this.copyModifiedDirs(bowerDir, path.join(webDir, 'bower'), BOWER_KEY);

        return modified;
    }

    copyModifiedDirs(from, to, key) {
        return this.copyModified(from, to, key, {
            file: false,
            dir: true,
            recurse: false
        });
    }

    copyModifiedFiles(from, to, key) {
        return this.copyModified(from, to, key);
    }

    copyModified(from, to, key, options) {
        let currentFiles = fileUtils.readModifiedTime(from, options),
            previousFiles = fileUtils.loadModifiedTime(this.projectDir, key),
            result = fileUtils.diff(previousFiles, currentFiles),
            copyFiles = result.modified.concat(result.added),
            removeFiles = result.removed;

        if ((copyFiles.length + removeFiles.length) === 0) {
            return false;
        }

        copyFiles.forEach((file, index, array) => {
            let origin = path.join(from, file),
                target = path.join(to, file);

            shelljs.mkdir('-p', path.dirname(target));
            shelljs.cp('-Rf', origin, target);
        });

        removeFiles.forEach((file, index, array) => {
            shelljs.rm('-rf', path.join(to, file));
        });

        fileUtils.saveModifiedTime(this.projectDir, key, currentFiles);

        return true;
    }

    build() {
        // var androidKitDir = path.join(this.projectDir, 'build', 'android'),
        // 	stagingDir = path.join(androidKitDir, 'staging');
        var xcodeprojDir = path.join(this.projectDir, 'src', 'ios', this.project.data().name + '.xcodeproj');

        shelljs.exec('/usr/bin/xcodebuild -project ' + xcodeprojDir);
        return Q();
    }

    finish() {
        // var project = this.project.data(),
        // 	buildDir = path.join(this.projectDir, 'build'),
        // 	apkDir = path.join(buildDir, 'android', 'staging', 'build', 'outputs', 'apk'),
        // 	files = shelljs.ls(path.join(apkDir, '*.apk'));

        // for (var i = 0; i < files.length; i++) {
        // 	var newName = path.basename(files[i].replace(/staging/igm, project.name)),
        // 		targetFile = path.join(buildDir, newName);

        // 	shelljs.mv(files[i], targetFile);
        // }
    }

}

module.exports = BuildIosTask;
