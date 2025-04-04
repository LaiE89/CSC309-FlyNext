#!/bin/bash
set -e
source .env

echo "Fetching cities from AFS..."
curl -s -H "x-api-key: $AFS_API_KEY" "https://advanced-flights-system.replit.app/api/cities" > database_data/cities.json

echo "Fetching airports from AFS..."
curl -s -H "x-api-key: $AFS_API_KEY" "https://advanced-flights-system.replit.app/api/airports" > database_data/airports.json

echo "Importing data into FlyNext & AFS..."
docker-compose exec app sh -c "node import_data.js database_data"

echo "Data import complete."