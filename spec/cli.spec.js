var assert = require('assert');

describe('Array', function() {

	describe('#indexOf()', function() {
		it('should return -1 when the value is not present', function() {
			expect([1, 2, 3].indexOf(4)).toBe(-1);
		});

	});

});

require('../globals');
var Cli = require('../src/cli');
var Q = require('q');

describe('Cli', function() {
	it('should have cli defined', function() {
		expect(Cli).toBeDefined();

		//assert.notEqual(Cli, undefined);
	});

	describe('#run', function() {
		it('should run "printCloudBridge" on run', function(done) {
			spyOn(Cli, 'printCloudBridge').andReturn(Q(true));

			Cli.run(['node.exe', 'index.js'])
				.then(function() {
					expect(Cli.printCloudBridge).toHaveBeenCalled();
					done();
				});
		});
	});

});
