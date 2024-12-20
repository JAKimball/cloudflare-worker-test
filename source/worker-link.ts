import * as https from 'https';

export function fetchWorkerData() {
	let myHeaders = new Headers();
	myHeaders.append('Connection', 'close');

	let requestOptions: RequestInit = {
		method: 'GET',
		headers: myHeaders,
		redirect: 'follow',
		mode: 'same-origin',
	};

	let timeout: NodeJS.Timeout;
	let promise = Promise.race([
		fetch(
			'https://misty-violet-6168.42files.workers.dev/counter',
			requestOptions,
		).then(response => response.text()),
		new Promise(
			(_resolve, reject) =>
				(timeout = setTimeout(() => reject(new Error('Timeout')), 5000)),
		),
	]);

	promise
		.then(result => {
			clearTimeout(timeout);
			console.log(result);
		})
		.catch(error => {
			clearTimeout(timeout);
			console.log(error);
		});
}

let callCount = 0;
let options: https.RequestOptions = {
	method: 'GET',
	hostname: 'misty-violet-6168.42files.workers.dev',
	path: '/counter',
	headers: {},
	agent: new https.Agent({keepAlive: true, keepAliveMsecs: 20000}),
};

export function testWorker() {
	const timeLabel = `Request ${callCount}`;
	console.time(timeLabel);

	let req = https.request(options, res => {
		let chunks: Uint8Array[] = [];

		res.on('data', chunk => {
			chunks.push(chunk);
		});

		res.on('end', (_chunk: Buffer) => {
			let body = Buffer.concat(chunks);
			console.log(
				`${timeLabel}: (Local Port# ${
					(req.socket?.address() as import('net').AddressInfo)?.port
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

interface RunFunction {
	(): void;
}

function runNTimes(f: RunFunction, n: number = 1): void {
	console.log(
		`Running ${f.name} ${n} times (${callCount + 1}-${callCount + n})`,
	);
	let label = 'Run Time';
	console.time(label);
	for (let i = 0; i < n; i++) {
		callCount++;
		f();
	}
	console.timeEnd(label);
}

export function runWorkerTestNTimes(n: number = 1) {
	runNTimes(testWorker, n);
}

export function runFetchWorkerDataNTimes(n: number = 1) {
	runNTimes(fetchWorkerData, n);
}

export function bigTest() {
	runNTimes(testWorker, 100);
}

// setTimeout(() => {
// 	runWorkerTestNTimes(50);
// 	// runFetchWorkerDataNTimes(5);
// }, 30);
