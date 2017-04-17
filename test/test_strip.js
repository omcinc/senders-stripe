const strip = require('../strip.js');
const fs = require("fs");
const assert = require("assert");
const Promise = require('bluebird');
const readFile = Promise.promisify(fs.readFile);
const writeFile = Promise.promisify(fs.writeFile);
const util = require('util');

Promise.all([
	readFile('./test/customers.json')
]).then(res => {
	const customers = JSON.parse(res[0]).data;
	customers[0].created = 1492076089; // Fixed the date for tests
	customers[1].created = 1492076089; // Fixed the date for tests
	const strip1 = strip(customers[0], true);
	assert.equal('https://storage.googleapis.com/senders-images/cards/stripe.png', strip1.icon);
	assert.equal(strip1.link, 'https://dashboard.stripe.com/customers/cus_AT0MyKnpQdHOXG');
	assert.equal(strip1.text, 'Customer added 4 days ago. \n\nSubscribed to Abonnement Premium annuel - active - 48 € /year. Ends on Apr 13, 2018');
	const strip2 = strip(customers[1], true);
	assert.equal('https://storage.googleapis.com/senders-images/cards/stripe.png', strip2.icon);
	assert.equal(strip2.link, 'https://dashboard.stripe.com/customers/cus_AT0MyKnpQdHOXG');
	assert.equal(strip2.text, 'Customer added 4 days ago. \n\nSubscribed to Abonnement Premium annuel - active - 48 € /year');
	console.log('Test OK');
}).catch(err => {
	console.log(util.inspect(err));
});

