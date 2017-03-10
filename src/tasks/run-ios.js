'use strict';

var RunTask = cb_require('tasks/run'),
    shelljs = require('shelljs'),
    Q = require('q'),
    path = require('path');

class RunIosTask extends RunTask {

    run(cloudbridge, argv) {
        var project = this.project.data(),
            packagePath = path.join(this.projectDir, 'src', 'ios', 'build', 'Release-iphoneos', project.name + '.app'),
            opts = {
                replace: true
            },
            target = null,
            activity = project.id + '/.' + project.name + 'Activity';

        return this.build(argv)
            .then(() => {
                var dev = shelljs.exec('ios-deploy -c').stdout.replace('[\.\.\.\.] Waiting up to 5 seconds for iOS device to be connected\n', '');
                return dev
            })
            .then((targetDevice) => {
                console.log('\n');
                console.log('targetDevice', targetDevice);
                console.log('\n');

                if (targetDevice.length === 0) {
                    throw new Error("No devices found.");
                }

                return shelljs.exec('ios-deploy -b ' + packagePath + ' -d');
            })
    }

    build(argv) {
        let BuildIosTask = require('./build-ios'),
            task = new BuildIosTask();

        return task.run(cli, argv);
    }

}

module.exports = RunIosTask;
