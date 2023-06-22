# Icecast Sound Analysis

This component focuses on analyzing the audio from an Icecast stream to extract the current beats per minute (BPM) for controlling the light show of the DMX LED strips. The analysis is performed using Liquidsoap, and the BPM data is forwarded to an Express app acting as a normalizer.

## Prerequisites

To use the sound analysis functionality, ensure you have the following:

- Icecast stream: Set up and run an Icecast stream as the audio source for analysis.
- Docker: Install Docker on your system for easy containerization and deployment.

## Usage

To use the sound analysis component, follow these steps:

1. Set Environment Variables: Before running the analysis, configure the necessary environment variables. These variables typically include the Icecast stream URL and port, as well as the url of the pi.

2. Start the Sound Analysis Service: Use Docker Compose to start the sound analysis service. The Docker Compose file is included in the repository and takes care of setting up the required containers. Run the following command in the repository's root directory:

   ```shell
   docker-compose up -d
   ```

    This command starts the sound analysis service in detached mode, allowing it to run in the background.

3. Integration with DMX LED Control: Once the sound analysis service is running, integrate the normalized BPM data with the DMX LED strip control functionality. This integration depends on your specific setup and requirements. You may need to establish communication between the Express app and the LED strip controller using appropriate protocols and libraries.