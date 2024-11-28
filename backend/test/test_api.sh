#!/bin/bash

# Set the FastAPI URL
BASE_URL="http://localhost:8001"
#BASE_URL="http://54.221.75.9:8001"

# Set user details
USERNAME="testuser"
PASSWORD="testpassword"
EMAIL="test@example.com"

#Step 2: Register a new user
echo "Creating a new user..."
RESPONSE=$(curl -X POST "$BASE_URL/api/auth/register" \
                -H "Content-Type: application/json" \
                -d '{
                    "username": "'"$USERNAME"'",
                    "password": "'"$PASSWORD"'",
                    "email": "'"$EMAIL"'"
                }'
        )

# Print the response
#echo -e "\nResponse from user creation:\n$RESPONSE"

# Step 3: Log in to get the JWT token
echo -e "\nLogging in to obtain the JWT token..."
RESPONSE=$(curl -X POST "$BASE_URL/api/auth/login" \
                -H "Content-Type: application/json" \
                -d '{
                    "username_email": "'"$USERNAME"'",
                    "password": "'"$PASSWORD"'"
                }'
        )

# Extract the token from the response (using jq)
TOKEN=$(echo $RESPONSE | jq -r '.access_token')

# Check if token is empty
if [ "$TOKEN" == "null" ]; then
    echo "Failed to obtain token. Please check your credentials."
    exit 1
fi

echo -e "\nObtained token: $TOKEN"


echo -e "\nAccessing the backtest endpoint with the token..."
curl -X POST "$BASE_URL/api/backtest" \
     -H "Content-Type: application/json" \
     -b "access_token=$TOKEN" \
     -d @backtest.json | jq

echo -e "\nSaving backtest..."
curl -X POST "$BASE_URL/api/backtest/save" \
     -H "Content-Type: application/json" \
     -b "access_token=$TOKEN" \
     -d @backtest_res.json | jq

echo -e "\nAccessing the backtest endpoint with the token to get saved backtest..."
curl -X GET "$BASE_URL/api/backtest/saved" \
     -H "Content-Type: application/json" \
     -b "access_token=$TOKEN"


echo -e "\nAccessing the backtest endpoint with the token to get saved backtest..."
curl -X GET "$BASE_URL/api/backtest/result/9" \
     -H "Content-Type: application/json" \
     -b "access_token=$TOKEN"

'''
echo -e "\Delete backtest..."
curl -X DELETE "$BASE_URL/api/backtest/delete" \
     -H "Content-Type: application/json" \
     -b "access_token=$TOKEN" \
     -d '[0,1,2,3,4,5,6,7,8]'
'''

