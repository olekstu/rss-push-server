const fetch = require('node-fetch');

function getLatest() {
	fetch('https://rss-push-server.herokuapp.com/getLatest/v2', {
		method: "GET",
		headers: {
			"x-api-key": "27dc631abdf20919dae9619ac572ec4139540337f5080e0ca2595595e8db6afa9a4c3d836ac113b730198bdc1ec4c5bd81e0197dfcb57a2d6bd77d03c28db8a99edd02a1920a51954a04aeab380de3b6412e62fac250c70859807eb6d037d496ec54d45676c1a2e3d2"
		}
	})
	.then(resp => console.log(resp.status))
	.catch(err => console.log(err))
}

getLatest();