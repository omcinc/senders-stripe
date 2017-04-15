#!/usr/bin/env node
const axios = require("axios");
const Rx = require('rxjs');
const Promise = require("bluebird");
const util = require('util');
const strip = require('./strip');

/**
 * Returns the oauth URL to be called from the browser to trigger the oauth process.
 *
 * @param {Object} [options]
 * @param {String} [options.redirectUri] OAuth redirect URI
 * @param {String} [options.clientId] OAuth client ID
 * @param {String} params additional parameters, such as loginHint, state, etc.
 * @returns {String} The OAuth URL
 */
module.exports.oauth = function (params, options) {
	const scope = 'read_only';
	return 'https://connect.stripe.com/oauth/authorize?response_type=code&client_id=' + options.clientId + '&scope=' + scope;
};

/**
 * Send the authorization code and retrieve a refresh token.
 *
 * @param {String} [params]
 * @param {String} [params.code] Authorization code
 * @param {String} [params.hmac] Shopify signature
 * @param {String} [params.shop] The shop domain
 * @param {Object} [options]
 * @param {String} [options.redirectUri] OAuth redirect URI
 * @param {String} [options.clientId] OAuth client ID
 * @param {String} [options.clientSecret] OAuth client secret
 * @returns {String} The OAuth URL
 */
module.exports.authorize = function (params, options) {
	// TODO Verify hmac, state & shop (see https://help.shopify.com/api/getting-started/authentication/oauth#get-the-client-credentials)
	return new Promise(function (resolve, reject) {
		const code = params.code;
		axios.post('https://connect.stripe.com/oauth/token', {
			client_secret: options.clientSecret,
			code: code,
			grant_type: "authorization_code"
		}).then(res => {
			resolve({
				refreshToken: res.data.refresh_token,
				accessToken: res.data.access_token,
				metadata: {
					livemode: res.data.livemode,
					stripe_user_id: res.data.stripe_user_id
				},
			});
		}).catch(err => {
			reject(normalizeError(err));
		});
	});
};

module.exports.refresh = function (oauthToken, options) {
	return new Promise(function (resolve, reject) {
		console.log('Using refresh token: ' + oauthToken.refreshToken);
		axios.post('https://connect.stripe.com/oauth/token?grant_type=refresh_token&refresh_token=' + oauthToken.refreshToken, {
			client_secret: options.clientSecret
		}).then(res => {
			if (res.data.access_token) {
				resolve({
					accessToken: res.data.access_token,
					refreshToken: res.data.refresh_token,
					metadata: {
						livemode: res.data.livemode,
						stripe_user_id: res.data.stripe_user_id
					},
				});
			} else {
				reject(normalizeError('Campaign Monitor: No access token returned for the given refresh token'));
			}
		}).catch(err => {
			reject(normalizeError(err));
		});
	});
};

function makeConfig(oauthToken) {
	return {
		baseURL: "https://api.stripe.com/v1/",
		headers: {
			"Authorization": "Bearer " + oauthToken.accessToken
		}
	};
}

module.exports.account = function (oauthToken) {
	return new Promise(function (resolve, reject) {
		getAccount(makeConfig(oauthToken)).subscribe(res => {
			resolve({
				loginName: res.data[0].business_name + ' (' + res.data[0].email + ')',
				accountUrl: 'https://dashboard.stripe.com/dashboard'
			});
		}, error => {
			reject(normalizeError(error));
		});
	});
};

module.exports.fetch = function (oauthToken, email) {
	return new Promise(function (resolve, reject) {
		const config = makeConfig(oauthToken);
		searchCustomer(config, email)
			.subscribe(customer => {
				resolve(strip(customer));
			}, error => {
				reject(normalizeError(error));
			});
	});

};

/**
 * @param internalError
 * @return Error
 */
function normalizeError(internalError) {
	var error = new Error();
	if (typeof internalError === 'string') {
		error.message = internalError;
	} else { // if (internalError instanceof Error)
		if (internalError.message) {
			error.message = internalError.message;
		} else {
			error.message = 'No Error message';
		}
		if (internalError.response) {
			var response = internalError.response;
			if (response.status) {
				error.status = response.status;
			}
			if (response.statusText) {
				error.statusText = response.statusText;
			}
			if (response.data) {
				var data = response.data;
				if (data.Code && data.Message) {
					error.cause = {
						error: data.Code,
						error_description: data.Message
					}
				} else if (data.error && data.error_description) {
					error.cause = {
						error: data.error,
						error_description: data.error_description
					};
				} else {
					error.cause = {
						error: 'unknown',
						error_description: util.inspect(data)
					}
				}
			}
		}
	}
	return error;
}

/**
 * See https://stripe.com/docs/api/curl#retrieve_account
 */
function getAccount(config) {
	return Rx.Observable.fromPromise(axios.get('/accounts', config)).map(res => res.data);
}

function searchCustomer(config, email) {
	return Rx.Observable.fromPromise(axios.get('/customers?query=email:' + email, config)).map(res => res.data);
}
