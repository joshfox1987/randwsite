#!/bin/bash

# Configuration for R & W Property Solutions
PROJECT_ID="studio-3066782500-b50dd"
BUCKET_NAME="studio-3066782500-b50dd.firebasestorage.app"
COLLECTION_NAME="gallery_images"

echo "Starting image sync for project: ${PROJECT_ID}..."

# Get the list of images from the storage bucket
# Using gsutil to list all files recursively
IMAGES=$(gsutil ls gs://${BUCKET_NAME}/** 2>/dev/null)

if [ -z "$IMAGES" ]; then
    echo "No images found in gs://${BUCKET_NAME}/"
    echo "Please upload images to your storage bucket first."
    exit 1
fi

echo "Found images. Fetching access token for Firestore..."
TOKEN=$(gcloud auth print-access-token 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "Error: Could not retrieve an access token. Please run 'gcloud auth login' first."
    exit 1
fi

echo "Syncing images to Firestore via REST API (this is more reliable than gcloud)..."

for IMAGE in $IMAGES
do
  # Skip directories
  if [[ $IMAGE == */ ]]; then
    continue
  fi

  # Get the image file name
  IMAGE_NAME=$(basename "$IMAGE")
  
  # Clean up the name for the description
  DESCRIPTION=$(echo "$IMAGE_NAME" | cut -f 1 -d '.' | tr '_' ' ')

  # Get the path within the bucket (encoded for the URL)
  PATH_PART=$(echo "$IMAGE" | sed "s|gs://${BUCKET_NAME}/||")
  ENCODED_PATH=$(echo "$PATH_PART" | sed 's|/|%2F|g' | sed 's/ /%20/g')
  
  # Construct the public URL for Firebase Storage
  IMAGE_URL="https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o/${ENCODED_PATH}?alt=media"

  echo "Linking ${IMAGE_NAME}..."

  # Create the document in Firestore using the REST API
  curl -s -X POST "https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION_NAME}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"fields\": {
        \"url\": { \"stringValue\": \"${IMAGE_URL}\" },
        \"imageUrl\": { \"stringValue\": \"${IMAGE_URL}\" },
        \"description\": { \"stringValue\": \"${DESCRIPTION}\" },
        \"uploadedAt\": { \"timestampValue\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\" }
      }
    }" > /dev/null

done

echo "Sync complete! Refresh your website to see the cinematic gallery updated."
