#!/bin/bash

# Load environment variables from .env file
export $(grep -v '^#' ../.env | xargs)

# API endpoints
BASE_URL="http://localhost:8001/api"
LOGIN_ENDPOINT="$BASE_URL/auth/login"
CREATE_USER_ENDPOINT="$BASE_URL/auth/create-botadmin"

# Credentials for superadmin
SUPERADMIN_USERNAME="superadmin"
SUPERADMIN_PASSWORD="$SUPERADMIN_SECRET_KEY"

# Credentials for botadmin
BOTADMIN_USERNAME="botadmin"
BOTADMIN_EMAIL="botadmin@example.com"
BOTADMIN_PASSWORD="$BOTADMIN_SECRET_KEY"

# Log in as superadmin to retrieve access token
echo "Logging in as superadmin..."
response=$(curl -s -X POST "$LOGIN_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d '{
          "username_email": "'"$SUPERADMIN_USERNAME"'",
          "password": "'"$SUPERADMIN_PASSWORD"'"
        }')

# Extract access token from the response
ACCESS_TOKEN=$(echo "$response" | jq -r '.access_token')

if [ "$ACCESS_TOKEN" == "null" ]; then
    echo "Failed to log in as superadmin. Response:"
    echo "$response"
    exit 1
fi

echo "Successfully logged in as superadmin."

# Create botadmin
echo "Creating botadmin..."
create_response=$(curl -X POST "$CREATE_USER_ENDPOINT" \
                -H "Content-Type: application/json" \
                -b "access_token=$ACCESS_TOKEN" \
                -d '{
                    "username": "'"$BOTADMIN_USERNAME"'",
                    "password": "'"$BOTADMIN_PASSWORD"'",
                    "email": "'"$BOTADMIN_EMAIL"'"
                }'
        )
    -
