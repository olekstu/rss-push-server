const express = require('express');
const admin = require('firebase-admin');
const Parser = require('rss-parser');


admin.initializeApp({
	credential: admin.credential.applicationDefault(),
	databaseURL: 'https://RSS-PUSH.firebaseio.com'
});

const registrationToken = 'eelP2tm0thY:APA91bHps_Ua903fC3JiCOLdhrqqe5ePoz4ZqumkKXnktG6JwkxpiTaX4tqKaNgYVKqqwRObNq_--56HrqqWAnhHLinHKQdOj1ru4QSnRfPQoIjXVOEoWJHANyapvolJqaL_fGiNPHcl';

//const registrationToken = 'fBjnn3Dnu8E:APA91bF5oGGnB6kropyOvRJwPXYQINCYWyS-uhZ74XzpxztaTFeLMspQHZCkSJlkTaPOzBGx3mAWWodyVTZkniPDXSal8E11gMBkMX3efExud-HsvlH-YfOe_8e5ElIWc8HZaG2dmY8p';

const parser = new Parser();


let lastBet = '';


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


const app = express();

app.get('/', (req, res) => {
	res.send('Hello from App Engine!');
});

app.get('/getLatest', async (req, res) => {
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

	res.sendStatus(200);
});

app.get('/send', (req, res) => {
	res.send('Send message!');
});

app.post('/send', (req, res) => {
	const regToken = req.body.regToken;
})



//app.listen(8080, () => {
//	console.log(`Server listening on port 8080`);
//});

//module.exports = app;




