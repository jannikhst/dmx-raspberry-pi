# DMX API Server

This repository contains the Node.js server that serves as the API for controlling DMX LED strips. The server requires OLA (Open Lighting Architecture) to be installed on the Linux machine. It provides several routes for managing the DMX channels, retrieving status information, controlling analyzer settings, managing sequences, and updating the server.

## Prerequisites

Before running the DMX API server, ensure the following prerequisites are met:

- OLA: Install OLA on the Linux machine where the server will run. OLA provides the necessary functionality for controlling DMX devices.

## Routes

The DMX API server exposes the following routes:

- `GET /channels`: Returns the current DMX channels with their values in JSON format.
- `GET /status`: Dumps various data in JSON format, including the current BPM, boolean flags, the last sequence, and more.
- `GET /analyzer`: Sets the `analyzer_enabled` flag to the provided query value (`?enabled=true`). If disabled, the server will ignore new BPM analyzer inputs.
- `ALL /proxy`: Toggles the `proxy_allowed` flag with every request. By default, the server connects to a proxy that forwards requests via WebSocket. This connection can be closed using this route.
- `ALL /update`: Reboots the server after fetching the newest build file from GitHub. Note that this functionality requires the required bash files and watchers to be active on the machine.
- `POST /stop`: Stops the sequence with the matching UID. Send a JSON body with the UID (`{ "uid": "76324-234-234" }`) to stop the corresponding sequence.
- `GET /stop`: Stops every running sequence.
- `POST /data`: Accepts JSON data like `{"rms": number, "ms": number}` as input for the sound analyzer. This route is only available if the `analyzer_enabled` flag is true or if the query has the key "allowed".
- `POST /dmx`: Accepts sequences as JSON and runs them. The server returns a response after the sequence finishes.

## Usage

To use the DMX API server, follow these steps:

1. Install OLA: Ensure that OLA is properly installed on your Linux machine.

2. Configuration: Modify any required configuration settings in the server code to match your setup, such as the port number.

3. Build the Server (Optional): If you need to make changes to the codebase, you can build the server yourself. Simply make your changes to the codebase and run `npm run build` afterwards. The output will be generated in the `/dist` directory as a single bundle (`index.js`).

4. Start the Server: Run the server using the appropriate command or script. Ensure that the necessary dependencies are installed.

5. Interact with the API: Make requests to the different routes described above to control the DMX LED strips, retrieve status information, and manage sequences.


## Conclusion

The DMX API server provides a comprehensive API for controlling DMX fixtures. By utilizing the specified routes, you can interact with the server to manage channels, retrieve status information, control analyzer settings, manage sequences, and update the server itself. Ensure that OLA is installed on your Linux machine before running the server. Customize the server configuration to match your specific setup. Enjoy the flexibility and control offered by the DMX API server in your DMX LED strip control project.
