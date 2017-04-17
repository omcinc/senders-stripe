const moment = require('moment');
const currencyFormatter = require('currency-formatter');

module.exports = function (customer, liveMode) {
	var res = '';
	var link = null;
	if (customer) {
		res += 'Customer added ' + moment(new Date(customer.created * 1000)).fromNow() + '. ';
		var subscriptionStr = '';
		if (customer.subscriptions && customer.subscriptions.data && customer.subscriptions.data.length > 0) {
			const subscription = customer.subscriptions.data[0];
			if (subscription.items && subscription.items.data && subscription.items.data.length > 0) {
				var item = subscription.items.data[0];
				if (item.plan) {
					const plan = item.plan;
					subscriptionStr = '\nSubscribed to ' + plan.name + ' - ' + subscription.status + ' - ' + currency(plan.amount / 100, plan.currency) + ' /' + plan.interval;
					if (subscription.cancel_at_period_end) {
						const ts = subscription.current_period_end;
						subscriptionStr += '. Ends on ' + moment(new Date(ts * 1000)).format('ll');
					}
				}
			}
		}
		res += subscriptionStr;
		link = 'https://dashboard.stripe.com/'+(liveMode ? '' : 'test/')+'customers/' + customer.id;
	} else {
		res = 'No customer data.';
		link = 'https://dashboard.stripe.com';
	}
	return {
		icon: 'https://storage.googleapis.com/senders-images/cards/stripe.png',
		text: res,
		link: link
	};
};

function currency(n, currency) {
	var num = Number.parseFloat(n);
	var precision = (((num - Math.floor(num)) > 0) ? 2 : 0);
	return currencyFormatter.format(num, { code: currency.toUpperCase(), precision: precision });
}