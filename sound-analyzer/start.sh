#!/bin/bash
# Check if network already exists
if ! docker network inspect liquidnet &> /dev/null; then
  # Network does not exist, create it
  echo "Creating network liquidnet..."
  docker network create liquidnet
else
  echo "Network liquidnet already exists."
fi

echo "Building images..."
docker build --rm -t liquidsoap ./liquidsoap 
docker build --rm -t bridge ./bridge

# Function to stop containers and exit script
function stop_containers_and_exit {
  echo ""
  echo "Stopping containers..."
  docker stop $container1_id $container2_id
  exit 0
}

# Register signal handler for SIGINT signal
trap 'stop_containers_and_exit' SIGINT

# Start container 1
container1_id=$(docker run --rm -d --net liquidnet --name liquidsoap -it liquidsoap)

# Start container 2
container2_id=$(docker run --rm -d --net liquidnet --name bridge -it bridge)

echo "Containers started with IDs: $container1_id $container2_id"

# Wait for signal to stop containers
echo "Press Ctrl+C to stop containers"
while true; do
  sleep 1
done