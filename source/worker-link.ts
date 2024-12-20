import * as https from 'https';

type WorkerMetaData = {
	perInstanceCounter: number;
	processCallCount: number;
	localPorts: number[];
};

type WorkerInstanceName = string;

const dataCenterMap = new Map<WorkerInstanceName, WorkerMetaData>();

export function getDataCenterMap() {
	return dataCenterMap;
}

export function getWorkerInstanceCount() {
	return dataCenterMap.size;
}

type WorkerResponse = {
	instanceName: WorkerInstanceName;
	perInstanceCounter: number;
};

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

const agent = new https.Agent({
	keepAlive: true,
	keepAliveMsecs: 20000,
	maxSockets: 256,
	timeout: 5000,
});

let options: https.RequestOptions = {
	method: 'GET',
	hostname: 'misty-violet-6168.42files.workers.dev',
	path: '/counter',
	headers: {},
	agent: agent,
	timeout: 5000,
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
			const localPort = (req.socket?.address() as import('net').AddressInfo)
				?.port;
			console.log(
				`${timeLabel}: (Local Port# ${localPort}): ${body.toString()}`,
			);
			console.timeEnd(timeLabel);

			// Parse the data
			let workerResponse: WorkerResponse = JSON.parse(body.toString());
			let instanceName = workerResponse.instanceName;
			let metaData = dataCenterMap.get(instanceName);
			if (metaData === undefined) {
				metaData = {
					perInstanceCounter: workerResponse.perInstanceCounter,
					processCallCount: 1,
					localPorts: [localPort as number],
				};
				dataCenterMap.set(instanceName, metaData);
			} else {
				metaData.perInstanceCounter = workerResponse.perInstanceCounter;
				metaData.processCallCount++;
				metaData.localPorts.push(localPort as number);
			}
		});

		res.on('error', error => {
			console.error(`${timeLabel} response error:`, error);
			console.timeEnd(timeLabel);
		});
	});

	req.setTimeout(5000);
	req.on('timeout', () => {
		console.error(`${timeLabel} timeout`);
		req.destroy();
		console.timeEnd(timeLabel);
	});

	req.on('error', error => {
		console.error(`${timeLabel} error:`, error);
		console.timeEnd(timeLabel);
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
		try {
			f();
		} catch (error) {
			console.error(`Error during execution of ${f.name}:`, error);
		}
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
//
