import axios from 'axios';
import express from 'express';


// ---------- Settings ----------
const BPM_MEDIAN_COUNT = 8;
const RMS_MEDIAN_COUNT = 3;
const BUFFER_SIZE = 50;
// ------------------------------


const app = express();
app.use(express.json());
const host = process.env.PIPONG_HOST ?? 'http://192.168.178.149:8000';
const path = process.env.PIPONG_PATH ?? '/wait';
const API_URL = host + '/' + path;
const receivedData: ReceivedData[] = [];

app.post('/data', async (req, res) => {
    try {
        const data = req.body as ReceivedData;
        console.log('received data: ', data);
        receivedData.push(data);
        if (receivedData.length > BUFFER_SIZE) {
            receivedData.shift();
        }
        await handle();
    } catch (error) {
        console.log('ignoring data: ', error);
    }
    res.send('ok');
});

app.listen(3000, () => {
    console.log('Listening on port 3000');
});

interface ReceivedData {
    bpm: number;
    rms: number;
}

interface OutputData {
    ms: number;
    rms: number;
}


let highestRMS = 0;

async function handle() {
    const lastBPMs = receivedData.slice(-BPM_MEDIAN_COUNT).map(d => d.bpm);
    const medianBpm = median(lastBPMs);
    const lastRMSs = receivedData.slice(-RMS_MEDIAN_COUNT).map(d => d.rms);
    const medianRms = Math.min(median(lastRMSs), 1);
    highestRMS = Math.max(highestRMS, medianRms);
    const normalizedRms = medianRms / highestRMS;

    const roundedBpm = Math.round(medianBpm);

    const out: OutputData = {
        ms: (60000 / roundedBpm),
        rms: normalizedRms,
    };

    await push(out);
}

async function push(data: OutputData) {
    try {
        console.log('pushing data: ', data);
        const json = JSON.stringify(data);
        const headers = {
            'Content-Type': 'application/json',
            'Content-Length': json.length,
            'Accept': '*/*',
        };
        await axios.post(API_URL, json, { headers, timeout: 1000 });
    } catch (error) {
        console.error(error);
    }
}

function median(array: number[]) {
    array.sort((a, b) => a - b);
    const half = Math.floor(array.length / 2);
    if (array.length % 2) {
        return array[half];
    }
    return (array[half - 1] + array[half]) / 2.0;
}