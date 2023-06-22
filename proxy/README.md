# Proxy Server for DMX API Communication

This repository contains a proxy server that facilitates communication with the DMX API server from external networks. The proxy server acts as an intermediary, forwarding incoming HTTP requests to all connected sockets, most of the time the Raspberry Pi node server. This setup enables seamless command transmission to the Raspberry Pi, even if the client is not in the same local network.

## Functionality

The proxy server offers the following functionality:

- **Request Forwarding**: Any incoming HTTP requests are forwarded to all connected sockets, including the Raspberry Pi node server. This allows clients from external networks to send commands to the DMX API server.

## Usage

To utilize the proxy server for DMX API communication, follow these steps:

1. Setup and Configuration: Set up the proxy server on a separate machine or server accessible from the internet. Ensure that the machine has Node.js and the necessary dependencies installed.

2. Clone the Repository: Clone this repository to the machine where the proxy server will be running.

3. Configure Proxy Server: Modify the configuration files, if necessary, to specify the desired port and any other required settings for the proxy server.

4. Install Dependencies: Install the required dependencies by running the command `npm install`. And build it by running `npm run build`.

5. Start the Proxy Server: Launch the proxy server by running the command `npm start`.

6. Establish Connection: Connect the Raspberry Pi node server as a socket to the proxy server. Update the connection settings in the Raspberry Pi node server configuration to match the proxy server's IP address and port.
