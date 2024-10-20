#!/bin/bash

# Set the FastAPI URL
BASE_URL="http://localhost:8001"

# Set user details
USERNAME="testuser"
PASSWORD="testpassword"
EMAIL="test@example.com"

# Step 1: Attempt to access the protected endpoint without being logged in
echo "Attempting to access the protected endpoint without being logged in..."
curl -X GET "$BASE_URL/api/protected_routes/protected" -i

#Step 2: Register a new user
echo "Creating a new user..."
RESPONSE=$(curl -X POST "$BASE_URL/api/auth/register" \
-H "Content-Type: application/json" \
-d '{
    "username": "'"$USERNAME"'",
    "password": "'"$PASSWORD"'",
    "email": "'"$EMAIL"'"
}')

# Print the response
echo -e "\nResponse from user creation:\n$RESPONSE"

# Step 3: Log in to get the JWT token
echo -e "\nLogging in to obtain the JWT token..."
RESPONSE=$(curl -X POST "$BASE_URL/api/auth/login" \
-H "Content-Type: application/json" \
-d '{
    "username_email": "'"$USERNAME"'",
    "password": "'"$PASSWORD"'"
}')

# Extract the token from the response (using jq)
TOKEN=$(echo $RESPONSE | jq -r '.access_token')

# Check if token is empty
if [ "$TOKEN" == "null" ]; then
    echo "Failed to obtain token. Please check your credentials."
    exit 1
fi

echo -e "\nObtained token: $TOKEN"

# Step 4: Access the protected endpoint using the token
echo -e "\nAccessing the protected endpoint with the token..."
curl -X GET "$BASE_URL/api/protected_routes/protected" \
-H "Authorization: Bearer $TOKEN" -i
