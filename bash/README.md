# Bash Scripts for Raspberry Pi Setup

This repository contains a set of bash scripts that can be used as a starting point to get your Raspberry Pi up and running with the DMX API server. While the scripts may not be entirely complete, they provide a foundation for configuring the DMX adapter, booting the API server, and monitoring its status.

## Scripts

The following bash scripts are included:

### bind_dmx_adapter.sh

This script binds the DMX adapter to the appropriate DMX universe. It uses the `ola_dev_info` command to identify the USB device and port associated with the DMX adapter and then uses `ola_patch` to bind the adapter to the universe.

### boot_api.sh

This script is responsible for booting the DMX API server. It starts by executing the `monitor_node.sh` script, which continuously monitors the Node.js application. It then starts the Nginx service to enable API communication.

### monitor_node.sh

This script continuously monitors the Node.js application of the DMX API server. It ensures that the server remains running and updates it with the latest version if needed. If the server encounters an exit code of 1, indicating an update request, the script attempts to download the latest version of the Node.js server using `wget`. If the download is unsuccessful, it continues using the existing server file.

## Usage

To use these bash scripts for Raspberry Pi setup and the DMX API server, follow these steps:

1. Make the Scripts Executable: Ensure that the scripts have executable permissions. Use the `chmod` command to make them executable if needed (`chmod +x <script_name>`).

2. Configure the Scripts: Modify the scripts to match your specific setup and requirements. Update any file paths, command options, or additional configurations as necessary.

3. Execute the Scripts: Run the scripts in the desired order to perform the necessary actions. Use the terminal or appropriate method to execute the scripts (`./<script_name>`).
