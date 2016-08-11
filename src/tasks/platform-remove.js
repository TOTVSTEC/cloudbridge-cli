var Task = cb_require('tasks/task').Task;

var CloudBridgeTask = function() { };
CloudBridgeTask.prototype = new Task();

CloudBridgeTask.prototype.run = function(cloudbridge, argv) {

};

exports.CloudBridgeTask = CloudBridgeTask;
