import React from 'react';
import { Text } from 'ink';
import * as worker from './worker-link.js'

type Props = {
	name: string | undefined;
};

export default function App({name = 'Stranger'}: Props) {
	return (
		<Text>
			Hello, <Text color="yellow">{name}</Text>
		</Text>
	);
}

// Hack to see if the worker-link module is functioning
// TODO: #1 Incorporate this into the test suite where it belongs and remove from here!
worker.runWorkerTestNTimes(5)
