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
	const customer = JSON.parse(res[1]).data[0];
	const strip1 = strip(shop, customer);
	assert.equal('https://storage.googleapis.com/senders-images/cards/stripe.png', strip1.icon);
	assert.equal(strip1.text, 'Customer added 7 days ago. 2 orders ($756)\n\nLast order 6 days ago _#1003_ ($700) IPhone 7 - paid - not fulfilled');
	assert.equal(strip1.link, 'https://omctest.myshopify.com/admin/customers/5140559698');
	console.log('Test OK');
}).catch(err => {
	console.log(util.inspect(err));
});

