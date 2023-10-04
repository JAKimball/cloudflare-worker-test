function fetchWorkerData() {
	let myHeaders = new Headers();
	myHeaders.append('Connection', 'close');

	let requestOptions = {
		method: 'GET',
		headers: myHeaders,
		redirect: 'follow',
		mode: 'same-origin',
	};

	let promise = Promise.race([
		fetch(
			'https://misty-violet-6168.42files.workers.dev/counter',
			requestOptions,
		).then(response => response.text()),
		new Promise((resolve, reject) =>
			setTimeout(() => reject(new Error('Timeout')), 5000),
		),
	]);

	promise.then(result => console.log(result)),
		promise.catch(error => console.log(error));
}

let callCount = 0;
let options = {
	method: 'GET',
	hostname: 'misty-violet-6168.42files.workers.dev',
	path: '/counter',
	headers: {},
	maxRedirects: 20,
};

https.globalAgent.keepAlive = true;
https.globalAgent.keepAliveMsecs = 20000;

export function testWorker() {
	let timeLabel = `Request ${++callCount}`;
	console.time(timeLabel);

	let req = https.request(options, res => {
		let chunks = [];

		res.on('data', chunk => {
			chunks.push(chunk);
		});

		res.on('end', chunk => {
			let body = Buffer.concat(chunks);
			console.log(
				`${timeLabel} (Local Port# ${
					req.socket.address().port
				}): ${body.toString()}`,
			);
			console.timeEnd(timeLabel);
		});

		res.on('error', error => {
			console.error(error);
		});
	});

	req.end();
}

export function runNTimes(f, n) {
	let label = 'Run Time';
	console.time(label);
	for (let i = 0; i < n; i++) f();
	console.timeEnd(label);
}
