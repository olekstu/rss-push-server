const express = require('express');
const admin = require('firebase-admin');
const Parser = require('rss-parser');
const bodyParser = require('body-parser');
const dao = require('./dao');
const { Expo } = require('expo-server-sdk');
const Cryptr = require('cryptr');
const cryptr = new Cryptr(process.env.ENCRYPTION_STRING);


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
		title: "New RSS notification",
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

app.use((req, res, next) => {
	console.log("INCOMING REQUESTS");
	if (cryptr.decrypt(req.headers["x-api-key"]) === process.env.API_KEY) {
		next();
	} else {
	res.send(401);
}
})

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
	console.log("RSSURL: " + rssUrl);
	console.log("userId: " + userId);
	console.log("token: " + token);
	dao.addRssUrlToUser(userId, rssUrl, token);
	res.send("Subscribed")
})


app.get('/getLatest/v2', async (req, res) => {
	console.log("GET LATEST");
	const rssUrlListToPoll = await dao.getAllRssUrls();
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

app.get('/userss/:userId/rssUrl/:rssUrl', async (req, res) => {
	const userId = req.params.userId;
	const rssUrl = decodeURIComponent(req.params.rssUrl);
	await dao.deleteRssUrlForUser(userId, rssUrl);
	res.send("DELETED")
})

app.get('/users/:userId', async (req, res) => {
	const userId = req.params.userId;
	const subscribedUrlsByUser = await dao.getUrlsByUserId(userId);
	res.send(subscribedUrlsByUser)
})



// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
	console.log(`Server listening on port 8080`);
});

module.exports = app;
