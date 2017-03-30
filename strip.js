const moment = require('moment');
const currencyFormatter = require('currency-formatter');

module.exports = function (customer) {
	var res = '';
	var link = null;
	if (customer) {
		res += 'Customer added ' + moment(customer.created_at).fromNow() + '. ';
		link = 'https://dashboard.stripe.com/test/customers/' + customer.id;
	} else {
		res = 'No customer data.';
	}
	return {
		icon: 'https://storage.googleapis.com/senders-images/cards/shopify.png',
		text: res,
		link: link
	};
};

function currency(n, shop) {
	var num = Number.parseFloat(n);
	var precision = (((num - Math.floor(num)) > 0) ? 2 : 0);
	var currency = shop && shop.currency || "USD";
	return currencyFormatter.format(num, { code: currency, precision: precision });
}