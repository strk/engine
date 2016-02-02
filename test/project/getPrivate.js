var assert = require('assert');
var supertest = require('supertest');
var chai = require('chai');
var expect = chai.expect;
var api = supertest('https://' + process.env.SYSTEMAPIC_DOMAIN);
var helpers = require('../helpers');
var token = helpers.token;
var httpStatus = require('http-status');
var expected = require('../../shared/errors');

module.exports = function () {
	describe('/api/project/get/private', function () {

	        it("should respond with status code 401 when not authenticated", function (done) {
	            api.post('/api/project/get/private')
	                .send()
	                .expect(httpStatus.UNAUTHORIZED)
	                .end(done);
	        });

	        it('should respond with status code 400 and specific error message if project_id or user_access_token don\'t exist in request body', function (done) {
	            token(function (err, access_token) {
	                api.post('/api/project/get/private')
	                    .send({
	                        access_token: access_token
	                    })
	                    .expect(httpStatus.BAD_REQUEST)
	                    .end(function (err, res) {
	                        if (err) {
	                            return done(err);
	                        }

	                        var result = helpers.parse(res.text);
	                        expect(result.error.message).to.be.equal(expected.missing_information.errorMessage);
	                        expect(result.error.code).to.be.equal(httpStatus.BAD_REQUEST);
	                        expect(result.error.errors.missingRequiredFields).to.be.an.array;
	                        expect(result.error.errors.missingRequiredFields).to.include('project_id');
	                        expect(result.error.errors.missingRequiredFields).to.include('user_access_token');
	                        done();
	                    });
	            });
	        });
	        
	        it('should respond with status code 200', function (done) {
	            token(function (err, access_token) {
	                api.post('/api/project/get/private')
	                    .send({
	                        access_token: access_token,
	                        project_id: 'some project_id',
	                        user_access_token: 'some user_access_token'
	                    })
	                    .expect(httpStatus.OK)
	                    .end(done);
	            });
	        });
			
	});
};
