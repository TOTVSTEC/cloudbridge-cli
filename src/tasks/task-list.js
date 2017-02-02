'use strict';

/*
Command Line Syntax

Text without brackets or braces   Items you must type as shown
<Text inside angle brackets>      Placeholder for which you must supply a value
[Text inside square brackets]     Optional items
{Text inside braces}              Set of required items; choose one
Vertical bar (|)                  Separator for mutually exclusive items; choose one
Ellipsis (…)                      Items that can be repeated

*/

var TASKS = require('./tasks.json');

TASKS.getTaskWithName = function getTaskWithName(name) {
	for (var i = 0; i < TASKS.length; i++) {
		var t = TASKS[i];

		if (t.name === name) {
			return t;
		}

		if (t.alt) {
			for (var j = 0; j < t.alt.length; j++) {
				var alt = t.alt[j];
				if (alt === name) {
					return t;
				}
			}
		}
	}
};

module.exports = TASKS;
