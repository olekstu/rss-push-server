const { Client } = require('pg')

const client = new Client({
	host: process.env.HOST,
	database: process.env.DATABASE,
	user: process.env.USER,
	password: process.env.PASSWORD,
	port: 5432

});

client
  .connect()
  .then(() => console.log('connected'))
  .catch(err => console.error('connection error', err.stack))

async function doesRssUrlExist(rssUrl) {
	const query = {
		text: 'SELECT exists(select 1 from RSSURLS where RSS_URL=$1)',
		values: [rssUrl]
	}
	const res = await client.query(query);
	return res.rows[0].exists;
}


async function getUrlsByUserId(userId) {
	const query = {
		text: 'SELECT * from USERS WHERE USER_ID = $1',
		values: [userId],
	}

	const res = await client.query(query);
	return res.rows;
}

async function addRssUrl(rssUrl) {
	const query = {
		text: 'INSERT INTO RSSURLS (rss_url) VALUES($1)',
		values: [rssUrl]
	}
	const res = await client.query(query);
	return res;
}

async function addRssUrlToUser(userId, rssUrl, token) {
	if (!await doesRssUrlExist(rssUrl)) {
		await addRssUrl(rssUrl);
	} 

	const query = {
		text: 'INSERT INTO USERS(user_id, rss_url, token) VALUES($1, $2, $3)',
		values: [userId, rssUrl, token]
	}
	const res = await client.query(query);
	return res;
}

async function getAllRssUrls() {
	const query = {
		text: 'SELECT RSS_URL, LAST_TITLE FROM RSSURLS',
		values: []
	}

	const res = await client.query(query);
	return res.rows;
}

async function updateTitleForRssUrl(lastTitle, rssUrl) {
	const query = {
		text: 'UPDATE RSSURLS SET LAST_TITLE = $1 WHERE RSS_URL = $2',
		values: [lastTitle, rssUrl]
	}
	const res = await client.query(query);
	return res;
}

async function getAllTokensForUrl(rssUrl) {
	const query = {
		text: 'SELECT TOKEN FROM USERS WHERE RSS_URL = $1',
		values: [rssUrl]
	}
	const res = await client.query(query);
	return res.rows.map(row => row.token);
}

async function deleteRssUrl(rssUrl) {
	const query = {
		text: 'DELETE FROM RSSURLS WHERE RSS_URL = $1',
		values: [rssUrl]
	}
	try {
		const res = await client.query(query);
		return res;
	}
	catch (error) {
		return null;
	}
}

async function deleteRssUrlForUser(userId, rssUrl) {
	const query = {
		text: 'DELETE FROM USERS WHERE USER_ID = $1 AND RSS_URL = $2',
		values: [userId, rssUrl]
	}
	const res = await client.query(query);
	await deleteRssUrl(rssUrl);

	return res;

}


exports.getUrlsByUserId = getUrlsByUserId;
exports.addRssUrlToUser = addRssUrlToUser;
exports.getAllRssUrls = getAllRssUrls;
exports.updateTitleForRssUrl = updateTitleForRssUrl;
exports.getAllTokensForUrl = getAllTokensForUrl;
exports.deleteRssUrlForUser = deleteRssUrlForUser;
