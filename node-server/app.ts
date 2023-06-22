import { spawn, ChildProcessWithoutNullStreams, exec } from 'child_process';
import { Readable } from 'stream';
import express from 'express';
import { ActionType, SequenceOut, parseSequence, SubSequenceOut, RandomWrapper, ActionOut, Channels, Time, isSubSequenceOut, isRandomWrapper, isFadeActionOut, isSetActionOut, isActionOut, isWaitActionOut, isRandomValue, isVolumeWhitespace } from '../typescript/server_models';
import cors from 'cors';
import { io } from "socket.io-client";
import axios, { AxiosResponse } from 'axios';


const app = express();
const socket = io('https://proxy.yucca.pro');
const PORT = process.env.PORT || 8000;


interface SocketRequest {
    method: string;
    path: string;
    body: any;
    identifier: string;
}

socket.on('connect', () => {
    console.log('connected with id', socket.id);
    runSequence({
        count: 1,
        actions: [
            {
                type: 'fade',
                time: 1000,
                channels: {
                    '0': 0,
                    '1': 255,
                    '2': 255,
                    '3': 0,
                    '4': 255,
                    '5': 255,
                    '6': 0,
                    '7': 255,
                    '8': 255,
                    '9': 0,
                    '10': 255,
                    '11': 255,
                },
            },
            {
                type: 'fade',
                time: 1000,
                channels: Object.fromEntries(Array.from(Array(512).keys()).map(i => [i.toString(), 0]))
            },
        ]
    });
});

socket.on('request', (data) => {
    if (!proxy_allowed) {
        return;
    }
    const request = data as SocketRequest;
    console.log('request', request.identifier);
    const axiosRequest = {
        method: request.method.toUpperCase(),
        url: 'http://localhost:' + PORT + request.path,
        data: request.body,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    console.log('axiosRequest', axiosRequest);
    axios(axiosRequest).catch(error => {
    }).then(response => {
        const res = (response as AxiosResponse)?.data;
        console.log(res);
        socket.emit(request.identifier, res);
    });
});

app.use(cors());
app.use(express.json());

const knownChannels: { [key: number]: number } = {};
const TICK_INTERVAL = 20;
const running_sequences: RunningSequence[] = [];
const canceled_sequences = new Set();
const dmxStream = new Readable({ read() { } });

const olaInstalled = process.platform === 'linux';

const cmd: ChildProcessWithoutNullStreams | undefined = olaInstalled ? spawn('ola_streaming_client', ['-u', '0']) : undefined;

cmd?.stdin.setDefaultEncoding('utf-8');
if (olaInstalled) {
    dmxStream.pipe(cmd!.stdin);
}

cmd?.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
});

cmd?.on('close', (code) => {
    console.log(`Streaming client closed ${code}`);
});


let bpmWhitespace = 100;
let volumeWhitespace = 1;
let proxy_allowed = true;
let lastSequence: SequenceOut | undefined;
let analyzer_enabled = true;

interface RunningSequence {
    sequence: SequenceOut;
    affected_channels: Set<string>;
    uid: number;
}

function sendDmx(): void {
    let stdin = '';
    for (let i = 0; i < 512; i++) {
        const value = knownChannels[i] !== undefined ? Math.max(0, Math.min(255, knownChannels[i])) : 0;
        stdin += `${value},`;
    }
    stdin = stdin.slice(0, -1);
    dmxStream.push(`${stdin}\n`);
}

function setDmx(channel: number, value: number) {
    knownChannels[channel] = Math.round(value);
}

app.get('/channels', (req, res) => {
    res.json(knownChannels);
});

app.get('/status', (req, res) => {
    res.json({
        bpmWhitespace,
        volumeWhitespace,
        running_sequences: running_sequences.map((sequence) => { return { uid: sequence.uid, channels: Array.from(sequence.affected_channels) } }),
        cancel_in_progress: Array.from(canceled_sequences),
        lastSequence,
        proxy_allowed,
        bpm: Math.round(60000 / bpmWhitespace),
        analyzer_enabled,
    });
});

app.get('/analyzer', (req, res) => {
    analyzer_enabled = req.query.enabled === 'true';
    res.json({ analyzer_enabled });
});


app.all('/proxy', (req, res) => {
    proxy_allowed = !proxy_allowed;
    if (proxy_allowed) {
        socket.connect();
    } else {
        socket.disconnect();
    }
    console.log('proxy allowed', proxy_allowed);
    res.send(proxy_allowed ? 'proxy allowed' : 'proxy not allowed');
});

app.all('/update', async (req, res) => {
    res.send('updating...');
    await wait(1000);
    process.exit(1);
});



app.post('/stop', (req, res) => {
    const uid = req.body.uid;
    canceled_sequences.add(uid);
    res.sendStatus(200);
});

app.get('/stop', async (req, res) => {
    // stop every sequence
    for (const sequence of running_sequences) {
        canceled_sequences.add(sequence.uid);
    }
    while (running_sequences.length > 0) {
        await wait(13);
    }
    canceled_sequences.clear();
    res.sendStatus(200);
});

app.post('/data', (req, res) => {
    const override = Object.keys(req.query).includes('allowed');
    // block if analyzer is disabled and not overriden
    if (!analyzer_enabled && !override) {
        res.json({ message: 'analyzer disabled', status: 'ignored', analyzer_enabled, override });
        return;
    }
    const ms = req.body.ms;
    const rms = req.body.rms;
    if (ms && typeof ms === 'number') {
        bpmWhitespace = ms;
    }
    if (rms && typeof rms === 'number') {
        volumeWhitespace = rms;
    }
    res.sendStatus(200);
});


app.post('/dmx', async (req, res) => {
    const sequence = parseSequence(req.body);
    console.log(JSON.stringify(sequence, null, 2));
    lastSequence = sequence;
    await runSequence(sequence);
    res.sendStatus(200);
});

function findAffectedChannels(actions: ActionType[], affected_channels: Set<string>) {
    for (const action of actions) {
        if (isSubSequenceOut(action)) {
            findAffectedChannels(action.actions, affected_channels);
        } else if (isRandomWrapper(action)) {
            for (const option of action.options) {
                findAffectedChannels([option], affected_channels);
            }
        } else if (isFadeActionOut(action)) {
            for (const key in action.channels) {
                affected_channels.add(key);
            }
        } else if (isSetActionOut(action)) {
            for (const key in action.channels) {
                affected_channels.add(key);
            }
        }
    }
}

async function runSequence(sequence: SequenceOut) {
    if (sequence.actions.length === 0) {
        console.log('Empty sequence');
        return;
    }

    const affected_channels: Set<string> = new Set();
    findAffectedChannels(sequence.actions, affected_channels);

    const conflicts = running_sequences.filter(running_sequence => {
        return Array.from(affected_channels).some(channel => running_sequence.affected_channels.has(channel));
    });

    conflicts.forEach(conflict => {
        canceled_sequences.add(conflict.uid);
    });

    const uid = createUid();
    running_sequences.push({
        sequence,
        affected_channels,
        uid
    });

    let endless = sequence.endless;
    let count = sequence.count ?? 1;
    while ((endless || count > 0) && !canceled_sequences.has(uid)) {
        for (const action of sequence.actions) {
            if (canceled_sequences.has(uid)) {
                break;
            }
            if (isActionOut(action)) {
                await handleAtomicAction(action, uid);
            } else if (isSubSequenceOut(action)) {
                await handleSubsequence(action, uid);
            } else if (isRandomWrapper(action)) {
                await handleRandom(action, uid);
            }
        }
        if (!endless && count) {
            count -= 1;
        }
    }
    canceled_sequences.delete(uid);
    running_sequences.splice(running_sequences.findIndex(running_sequence => running_sequence.uid === uid), 1);
}


async function handleAtomicAction(action: ActionOut, uid: number): Promise<void> {
    if (isFadeActionOut(action)) {
        await fade(action.channels, action.time, uid);
    } else if (isWaitActionOut(action)) {
        if (typeof action.time === 'number') {
            await wait(action.time);
        } else {
            await wait(action.time.factor * bpmWhitespace);
        }
    } else if (isSetActionOut(action)) {
        setChannels(action.channels);
        await wait(10);
    }
}

async function handleSubsequence(subsequence: SubSequenceOut, uid: number): Promise<void> {
    let count = 0;
    if (subsequence.count && isRandomValue(subsequence.count)) {
        const c = subsequence.count;
        count = Math.floor(Math.random() * (c.max - c.min) + c.min);
    } else {
        count = subsequence.count;
    }
    count = count ?? 1;
    for (let i = 0; i <= count; i++) {
        if (canceled_sequences.has(uid)) {
            break;
        }
        for (const subAction of subsequence.actions) {
            if (canceled_sequences.has(uid)) {
                break;
            }
            if (isActionOut(subAction)) {
                await handleAtomicAction(subAction, uid);
            } else if (isSubSequenceOut(subAction)) {
                await handleSubsequence(subAction, uid);
            } else if (isRandomWrapper(subAction)) {
                await handleRandom(subAction, uid);
            }
        }
    }
}


async function handleRandom(random: RandomWrapper, uid: number): Promise<void> {
    const possibilities = random.options;
    const possibility = possibilities[Math.floor(Math.random() * possibilities.length)];
    const subsequence: SubSequenceOut = {
        type: 'subsequence',
        actions: [possibility],
        count: 1
    };
    await handleSubsequence(subsequence, uid);
}

async function fade(channels: Channels, time: number | Time, uid: number): Promise<void> {
    const start = Date.now();
    const atomicTime = typeof time === 'number' ? time : time.factor * bpmWhitespace;
    const end = start + atomicTime;
    const startValues: { [key: string]: number } = {};
    for (const channel in channels) {
        const intChannel = parseInt(channel);
        startValues[channel] = knownChannels[intChannel] ?? 0;
    }
    const constants: Channels = {};
    for (const channel in channels) {
        const v = channels[channel];
        if (isRandomValue(v)) {
            constants[channel] = Math.floor(Math.random() * (v.max - v.min) + v.min);
        }
    }
    while (Date.now() < end && !canceled_sequences.has(uid)) {
        const progress = (Date.now() - start) / atomicTime;
        for (const channel in channels) {
            const startValue = startValues[channel];
            const endValue = constants[channel] ?? channels[channel];
            let currentValue = 0;
            if (typeof endValue === 'number') {
                currentValue = Math.round(startValue + (endValue - startValue) * progress);
            } else if (isVolumeWhitespace(endValue)) {
                currentValue = Math.round(startValue + (endValue.factor * (255 * bpmWhitespace) - startValue) * progress);
            }
            setDmx(parseInt(channel), currentValue);
        }
        sendDmx();
        await wait(TICK_INTERVAL);
    }
    setChannels(channels);
}

function setChannels(channels: Channels) {
    for (const channel in channels) {
        const channelValue = channels[channel];
        let result = 255;
        if (typeof channelValue === 'number') {
            result = channelValue;
        }
        if (isRandomValue(channelValue)) {
            result = Math.floor(Math.random() * (channelValue.max - channelValue.min) + channelValue.min);
        }
        if (isVolumeWhitespace(channelValue)) {
            result = Math.round(channelValue.factor * (result * volumeWhitespace));
        }
        setDmx(parseInt(channel), result);
    }
    sendDmx();
}

async function wait(time: number) {
    const t = Math.max(0, time);
    return new Promise(resolve => {
        setTimeout(resolve, t);
    });
}

// returns a int value that is between 0 and 999999999 and not yet used
function createUid() {
    let uid = Math.floor(Math.random() * 1000000000);
    while (canceled_sequences.has(uid) || running_sequences.some(running_sequence => running_sequence.uid === uid)) {
        uid = Math.floor(Math.random() * 1000000000);
    }
    return uid;
}


app.listen(PORT, async () => {
    console.log('DMX API running on port:', PORT);
    console.log('connecting to ws proxy...');
    socket.connect();
    await wait(1000);
    await runSequence({
        count: 2,
        actions: [
            {
                type: 'fade',
                time: 1000,
                channels: Object.fromEntries(Array.from(Array(512).keys()).map(i => [i.toString(), 255]))
            },
            {
                type: 'fade',
                time: 1000,
                channels: Object.fromEntries(Array.from(Array(512).keys()).map(i => [i.toString(), 0]))
            },
        ]
    });
});