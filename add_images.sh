#!/bin/bash

# Configuration for R & W Property Solutions
PROJECT_ID="studio-3066782500-b50dd"
BUCKET_NAME="studio-3066782500-b50dd.firebasestorage.app"
COLLECTION_NAME="gallery_images"

echo "Starting image sync for project: ${PROJECT_ID}..."
echo "Targeting bucket: gs://${BUCKET_NAME}"

# 1. Verify Authentication
TOKEN=$(gcloud auth print-access-token 2>/dev/null)
if [ -z "$TOKEN" ]; then
    echo "Error: Not authenticated. Please run 'gcloud auth login' first."
    exit 1
fi

# 2. List images from the storage bucket
IMAGES=$(gsutil ls gs://${BUCKET_NAME}/** 2>/dev/null)
if [ -z "$IMAGES" ]; then
    echo "No images found in gs://${BUCKET_NAME}/"
    echo "Please upload images to your storage bucket first."
    exit 1
fi

echo "Found images. Syncing to Firestore via REST API..."

for IMAGE in $IMAGES
do
  # Skip directories
  [[ $IMAGE == */ ]] && continue

  IMAGE_NAME=$(basename "$IMAGE")
  
  # Clean up the name for the description/title
  DESCRIPTION=$(echo "$IMAGE_NAME" | cut -f 1 -d '.' | tr '_' ' ')

  # Construct the public URL for Firebase Storage
  # Note: This assumes public read access is enabled in storage.rules
  ENCODED_NAME=$(echo "$IMAGE_NAME" | sed 's/ /%20/g')
  IMAGE_URL="https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o/${ENCODED_NAME}?alt=media"

  echo "Linking ${IMAGE_NAME}..."

  # Create the document in Firestore using the REST API (bypass gcloud firestore version issues)
  curl -s -X POST "https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION_NAME}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"fields\": {
        \"url\": { \"stringValue\": \"${IMAGE_URL}\" },
        \"imageUrl\": { \"stringValue\": \"${IMAGE_URL}\" },
        \"title\": { \"stringValue\": \"Project Update\" },
        \"description\": { \"stringValue\": \"${DESCRIPTION}\" },
        \"uploadedAt\": { \"timestampValue\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\" },
        \"order\": { \"integerValue\": \"$(date +%s)\" }
      }
    }" > /dev/null

done

echo "Sync complete! Refresh your website to see the cinematic gallery updated."
