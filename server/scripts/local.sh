#!/bin/bash


# This will start local for all the dependencies, including the database and the API server.
ACTION=$1
if [ "$ACTION" = "start" ]; then
    echo "Starting Docker servers..."
    sudo docker start my-postgres
    sudo docker start my-redis
elif [ "$ACTION" = "stop" ]; then
    echo "Stopping Docker servers..."
    sudo docker stop my-postgres
    sudo docker stop my-redis
else
    echo "Usage: $0 {start|stop}"
    echo "$ACTION is not a valid action."
fi

# TODO: Add more services to start/stop, such as the API server, if needed.