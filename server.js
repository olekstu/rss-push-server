const express = require('express');
const admin = require('firebase-admin');
const Parser = require('rss-parser');


admin.initializeApp({
	credential: admin.credential.applicationDefault(),
	databaseURL: 'https://RSS-PUSH.firebaseio.com'
});

const registrationToken = 'dtyBNx2gq14:APA91bGAG5CcYRjGBRgsJ6ERRttvDH6w5o94Xt7thk56JSDbVGlueW2AE-Z2ck0oNeEvRjsv0iIp9kzDsFctgP_XORi7626rvTsqpgwIHc4L4JpMZZhNGEMKEWp2-O0McCkDF8G87p9i';

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

		if (bet != lastBet) {
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
                sound: "justsaying.mp3",
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



setInterval(intervalFunc, 60000);

const app = express();

app.get('/', (req, res) => {
	res.send('Hello from App Engine!');
});

app.get('/send', (req, res) => {
	sendMessage('Liverpool v United', '1.70');
	res.send('Send message!');
});



app.listen(8080, () => {
	console.log(`Server listening on port 8080`);
});

module.exports = app;




