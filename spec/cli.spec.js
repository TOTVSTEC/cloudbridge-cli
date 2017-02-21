'use strict';

//var assert = require('assert');

function buildArgs() {
	var args = ['node.exe', 'index.js'];

	return args.concat(Array.prototype.slice.call(arguments));
}

describe('Array', function() {

	describe('#indexOf()', function() {
		it('should return -1 when the value is not present', function() {
			expect([1, 2, 3].indexOf(4)).toBe(-1);
		});

	});

});

require('../globals');
var Cli = require('../src/cli');
//var Q = require('q');

describe('Cli', function() {
	it('should have cli defined', function() {
		expect(Cli).toBeDefined();

		//assert.notEqual(Cli, undefined);
	});

	describe('#run', function() {
		it('should print startup banner and exit', function(done) {
			//spyOn(Cli, 'printCloudBridge').andReturn(Q(true));
			let args = buildArgs();

			Cli.run(args)
				.then(done)
				.catch((error) => {
					this.fail(error);
				});
		});
	});

	describe('#cache', function() {
		it('should list cached packages', function(done) {
			let args = buildArgs('cache', 'list');

			Cli.run(args)
				.then(done)
				.catch((error) => {
					this.fail(error);
				});
		});

		it('should clean cached packages', function(done) {
			let args = buildArgs('cache', 'clean');

			Cli.run(args)
				.then(done)
				.catch((error) => {
					this.fail(error);
				});
		});
	});


});
