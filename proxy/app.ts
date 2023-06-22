// setup socket.io + express
import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
    },
});

type Map<T> = { [key: string]: T };

const sockets: Map<Socket> = {};

app.use(cors())

io.on('connection', (socket: Socket) => {
    sockets[socket.id] = socket;
    console.log('connected');
    socket.on('disconnect', () => {
        console.log('disconnected');
        delete sockets[socket.id];
    });
});

const PORT = process.env.PORT || 3000;

app.use(express.json());

// a app route that accepts any method and any path and forwards it to all sockets
app.all('*', async (req, res) => {
    const { method, path, body } = req;
    console.log(method, path, body);
    const socketRequest = new SocketRequest(method, path, body);
    if (Object.keys(sockets).length === 0) { 
        res.json({
            message: 'no sockets connected to proxy',
            method,
            path,
            body,
        });
        return;
    }
    for (const socket of Object.values(sockets)) {
        socket.emit('request', socketRequest);
    }
    const response = await socketRequest.waitForResponse();
    res.send(response);
});


httpServer.listen(PORT, () => {
    console.log('listening on', PORT);
});



class SocketRequest {
    method: string;
    path: string;
    body: any;
    identifier: string;
    constructor(method: string, path: string, body: any) {
        this.method = method;
        this.path = path;
        this.body = body;
        this.identifier =
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
    }

    // await first response 
    async waitForResponse(): Promise<any> {
        return new Promise((resolve, reject) => {
            for (const socket of Object.values(sockets)) {
                socket.once(this.identifier, (response: any) => {
                    resolve(response);
                });
            }
        });
    }
}