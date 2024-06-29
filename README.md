# Beer Pong Table Control via DMX / App

This repository provides the resources of a small personal project that allows you to control the lights of a beer pong table remotely via App or directly via the DMX Protocol. The project utilizes a DIY DMX API server and provides various scripts, models, and servers to facilitate the control and interaction with the LED stripes. You can find a live demo of a example client at [https://beerpong.jannik.club](https://beerpong.jannik.club).

## Repository Structure

The repository is structured into the following subfolders:

### `/bash`

This folder contains bash scripts specifically designed for Raspberry Pi setup. The scripts assist in configuring the DMX adapter, booting the DMX API server, and monitoring its status.

### `/dart`

The Dart models in this folder are intended for Flutter apps and provide an interface for communicating with the DMX API server. These models enable you to control the DMX LED strips and build complex sequences for dynamic light shows.

### `/node-server`

The Node.js server in this folder serves as the API for controlling the DMX LED strips. It requires the installation of OLA (Open Lighting Architecture) and offers various routes for managing channels, retrieving status information, controlling sequences, and updating the server.

### `/proxy`

This folder contains a proxy server that facilitates communication with the DMX API server from external networks. The proxy server acts as an intermediary, forwarding incoming HTTP requests to the DMX API server, enabling seamless command transmission from clients outside the local network.

### `/sound-analyzer`

This foldwr contains resources that help you analyzing existing icecast streams and retrieving BPM and volume from them. You can also normalize those values and send them directly to the DMX API to match the lightshow speed with the music. 

### `/typescript`

The TypeScript models in this folder are essential for parsing and sending data from and to the API. These models provide a structured representation of the data and enhance code readability and maintainability.

## Usage

To utilize this project, follow the instructions provided in each subfolder's README file. Start by setting up the Raspberry Pi with the necessary configurations using the scripts in the `/bash` folder. Then, incorporate the Dart models in your Flutter app to control DMX fixtures. Use the Node.js server in the `/node-server` folder as the API for communication and sequence management. If needed, configure the proxy server in the `/proxy` folder and setup the `/sound-analyzer`. Or use the typescript models instead of the dart models to ensure consistent data handling throughout your application if you don't want to use flutter.

By combining the resources and instructions provided in each subfolder, you can effectively control the beer pong table using DMX LED strips and create captivating light shows for an enhanced gaming experience.