#!/bin/bash
echo "Starting system using Docker Compose..."
docker-compose down -v --remove-orphans
docker-compose up -d --build
