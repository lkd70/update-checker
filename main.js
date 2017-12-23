'use strict';

const cheerio = require ('cheerio');
const request = require ('request-promise-native');
const { promisify } = require ('util');
const fs = require('fs');

const transform = cheerio.load;

// CONFIG
const token = process.env.BOT_TOKEN;
const chats = [123456789];
const path = 'state.json';
const interval = 10 * 60 * 1000; // 10 minutes
// END CONFIG

const sendMessage = text => chat_id =>
	request ({
		url: `https://api.telegram.org/bot${token}/sendMessage`,
		form: { chat_id, text }
	});


async function check () {
	const url = 'https://play.google.com/store/apps/details?id=org.telegram.messenger&hl=en';

	const $ = await request ({ url, transform });

	const datePublished = $ ('[itemprop="datePublished"]') .text ();

	const file = await promisify (fs.readFile) (path)
		.then (JSON.parse)
		.catch (() => ({}))

	const { lastDatePublished } = file;

	if (datePublished === lastDatePublished) {
		return;
	}

	const recentChange = $ ('.recent-change')
		.toArray ()
		.map (node => $ (node) .text ())
		.join ('\n');

	file.lastDatePublished = datePublished;
	return Promise.all ([
		promisify(fs.writeFile) (path, JSON.stringify (file)),
		chats .map (sendMessage (recentChange)),
	]);
};

check();
setInterval(check, interval);
