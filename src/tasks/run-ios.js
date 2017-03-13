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
                var cmd = "",
                    i = 0,
                    isDbg = 0;

                console.log('\n');
                console.log('targetDevice', targetDevice);
                console.log('\n');

                if (targetDevice.length === 0) {
                    throw new Error("No devices found.");
                }

                for (i = 2; i < argv._.length; i++) {
                    switch (argv._[i].toUpperCase()) {
                        case "DEBUG":
                        case "D":
                            cmd += " -d";
                            isDbg = 1;
                            break;

                        case "ID":
                            if (argv._.length >= i + 1) {
                                if (targetDevice.indexOf(argv._[i + 1]) > -1) {
                                    cmd += " --id " + argv._[i + 1];
                                    i++;
                                    break;
                                }
                                throw new Error("Device (" + argv._[i + 1] + ") not found.");
                            }
                            throw new Error("Invalid command arguments.");
                    }
                }

                if (isDbg == 0)
                    cmd += " --justlaunch";

                return shelljs.exec('ios-deploy -b ' + packagePath + cmd);
            })
    }

    build(argv) {
        let BuildIosTask = require('./build-ios'),
            task = new BuildIosTask();

        return task.run(cli, argv);
    }

}

module.exports = RunIosTask;
