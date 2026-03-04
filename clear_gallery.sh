#!/bin/bash

# Configuration for R & W Property Solutions
PROJECT_ID="studio-3066782500-b50dd"
COLLECTION_NAME="gallery_images"

echo "CRITICAL: Clearing ALL project metadata from the gallery database..."

# 1. Verify Authentication and get token
TOKEN=$(gcloud auth print-access-token 2>/dev/null)
if [ -z "$TOKEN" ]; then
    echo "Error: Not authenticated. Please run 'gcloud auth login' first."
    exit 1
fi

# 2. List all document IDs in the collection using REST API
DOCS=$(curl -s -H "Authorization: Bearer ${TOKEN}" \
    "https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION_NAME}" \
    | grep "\"name\":" | sed 's/.*documents\/\(.*\)\",/\1/')

if [ -z "$DOCS" ]; then
    echo "Gallery is already empty. Nothing to clear."
    exit 0
fi

echo "Found existing records. Removing duplicates and starting over..."

# 3. Delete each document
for DOC_ID in $DOCS
do
    echo "Deleting record: ${DOC_ID}..."
    curl -s -X DELETE -H "Authorization: Bearer ${TOKEN}" \
        "https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${DOC_ID}" > /dev/null
done

echo "Database cleared! You can now run 'bash add_images.sh' to start fresh with a clean, single-copy gallery."
