const express = require('express');
const admin = require('firebase-admin');
const Parser = require('rss-parser');
const bodyParser = require('body-parser');


admin.initializeApp({
	credential: admin.credential.applicationDefault(),
	databaseURL: 'https://RSS-PUSH.firebaseio.com'
});

const registrationToken = 'eelP2tm0thY:APA91bHps_Ua903fC3JiCOLdhrqqe5ePoz4ZqumkKXnktG6JwkxpiTaX4tqKaNgYVKqqwRObNq_--56HrqqWAnhHLinHKQdOj1ru4QSnRfPQoIjXVOEoWJHANyapvolJqaL_fGiNPHcl';

//const registrationToken = 'fBjnn3Dnu8E:APA91bF5oGGnB6kropyOvRJwPXYQINCYWyS-uhZ74XzpxztaTFeLMspQHZCkSJlkTaPOzBGx3mAWWodyVTZkniPDXSal8E11gMBkMX3efExud-HsvlH-YfOe_8e5ElIWc8HZaG2dmY8p';

const parser = new Parser();


let lastBet = '';

function intervalFunc() {

	(async () => {

		let feed = await parser.parseURL('https://bettin.gs/joaosaldanha/bets/feed');
		const item = feed.items[0]; 		
		const content = item.content;
		const startIndex = content.indexOf('Odds');
		const odds = content.substring(startIndex, startIndex + 28);
		const bet = item.title;

		if (bet !== lastBet) {
			lastBet = bet;
			sendMessage(bet, odds);

		} else {			
			console.log("NOT NEW TITLE");
		}
	})();

}

function sendMessage(title, body) {
	admin
	.messaging()
	.send({
		notification: {
			title: "NEW BET: " + title,
			body: body
		},
		android:{
			notification:{
				sound: "maybeoneday.mp3",
				priority: "high",
				icon: "humanpictos"
			}
		},
		token: registrationToken
	})
	.then((response) => {
		console.log('Successfully sent message:', response);
	})
	.catch((error) => {
		console.log('Error sending message:', error);
	});
}

function subscribeToTopic(regToken, topic) {
	admin.messaging().subscribeToTopic([regToken], topic)
	.then(function(response) {
    // See the MessagingTopicManagementResponse reference documentation
    // for the contents of response.
    console.log('Successfully subscribed to topic:', response);
})
	.catch(function(error) {
		console.log('Error subscribing to topic:', error);
	});

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



setInterval(intervalFunc, 60000);

const app = express();
app.use(bodyParser.urlencoded());

app.use(bodyParser.json());


app.get('/', (req, res) => {
	res.send('Hello from App Engine!');
});

app.get('/send', (req, res) => {
	admin
	.messaging()
	.send({
		notification: {
			title: "TEST",
			body: "BODY"
		},
		android:{
			notification:{
				sound: "maybeoneday.mp3",
				priority: "high",
				icon: "humanpictos"
			}
		},
		topic: "TEST"
	})
	.then((response) => {
		console.log('Successfully sent message:', response);
	})
	.catch((error) => {
		console.log('Error sending message:', error);
	});
	res.send('Send message!');
});

app.post('/subcsribeToTopic', (req, res) => {
	const regToken = req.body.regToken;
	const topic = req.body.rssUrl;
	console.log(regToken);
	console.log(topic);
	subscribeToTopic(regToken, topic);
	res.send("Subscribed")
})

app.post('/unSubsribeToTopic', (req, res) => {
	const regToken = req.body.regToken;
	const topic = req.body.rssUrl;
	unSubscribeToTopic(regToken, topic);
	res.send("Unsubscribed")
})



app.listen(8080, '0.0.0.0', () => {
	sendMessage('Liverpool v United', '1.70');
	console.log(`Server listening on port 8080`);
});

module.exports = app;




