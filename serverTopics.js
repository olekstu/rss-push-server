const express = require('express');
const admin = require('firebase-admin');
const Parser = require('rss-parser');
const bodyParser = require('body-parser');
const dao = require('./dao');
const { Expo } = require('expo-server-sdk');


admin.initializeApp({
	credential: admin.credential.applicationDefault(),
	databaseURL: 'https://RSS-PUSH.firebaseio.com'
});


// Create a new Expo SDK client
let expo = new Expo();

const parser = new Parser();

const rssUrls = [];


async function sendUpdatedTitleToUsers(title, rssUrl) {
	const allTokensToSendTo = await dao.getAllTokensForUrl(rssUrl);
	const messages = allTokensToSendTo.map(token => ({
		to: token,
		sound: 'default',
		body: title,
		data: { withSome: 'data' },
	}));
	let chunks = expo.chunkPushNotifications(messages);
	let tickets = [];
	(async () => {
		for (let chunk of chunks) {
			try {
				let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
				console.log(ticketChunk);
				tickets.push(...ticketChunk);
			} catch (error) {
				console.error(error);
			}
		}
	})();
}


function unSubscribeToTopic(regToken, topic) {
	admin.messaging().unsubscribeFromTopic([regToken], topic)
	.then(function(response) {
    // See the MessagingTopicManagementResponse reference documentation
    // for the contents of response.
    console.log('Successfully unsubscribed from topic:', response);
})
	.catch(function(error) {
		console.log('Error unsubscribing from topic:', error);
	});
}



const app = express();

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());


app.get('/', (req, res) => {
	res.send('Hello from App Engine!');
});


app.post('/addUserToRssUrl', (req, res) => {
	console.log("ADD USER TO URL");
	const rssUrl = req.body.rssUrl;
	const userId = req.body.userId;	
	const token = req.body.token;
	dao.addRssUrlToUser(userId, rssUrl, token);
	res.send("Subscribed")
})


app.get('/getLatest', async (req, res) => {
	const rssUrlListToPoll = await dao.getAllRssUrls();
	console.log(rssUrlListToPoll);
	rssUrlListToPoll.forEach(async rssUrlToPoll => {
		const feed = await parser.parseURL(rssUrlToPoll.rss_url);
		const item = feed.items[0]; 		
		const polledContent = item.content;
		const polledTitle = item.title;

		if (polledTitle !== rssUrlToPoll.last_title) {
			await dao.updateTitleForRssUrl(polledTitle, rssUrlToPoll.rss_url);		
			await sendUpdatedTitleToUsers(polledTitle, rssUrlToPoll.rss_url);

		} else {			
			console.log("Not new title");
		}
	})

	res.sendStatus(200);
});

app.get('/users/:userId', async (req, res) => {
	const userId = req.params.userId;
	const subscribedUrlsByUser = await dao.getUrlsByUserId(userId);
	console.log("Returning:")
	console.log(subscribedUrlsByUser);
	res.send(subscribedUrlsByUser)
})



app.listen(8080, '0.0.0.0', () => {
	console.log(`Server listening on port 8080`);
});

module.exports = app;
