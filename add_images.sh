#!/bin/bash

# Configuration for R & W Property Solutions
PROJECT_ID="studio-3066782500-b50dd"
BUCKET_NAME="studio-3066782500-b50dd.firebasestorage.app"
COLLECTION_NAME="gallery_images"

echo "Starting image sync for project: ${PROJECT_ID}..."

# Get the list of images from the storage bucket
# Using gsutil which is standard for storage operations
IMAGES=$(gsutil ls gs://${BUCKET_NAME}/gallery_images/ 2>/dev/null || gsutil ls gs://${BUCKET_NAME}/)

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

echo "Syncing images to Firestore via REST API..."

# Loop through each image and add it to Firestore using the REST API
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

  # Construct the public URL for Firebase Storage
  # We use the standard format for publicly readable storage files
  ENCODED_NAME=$(echo "$IMAGE_NAME" | sed 's/ /%20/g')
  
  if [[ $IMAGE == *gallery_images* ]]; then
    IMAGE_URL="https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o/gallery_images%2F${ENCODED_NAME}?alt=media"
  else
    IMAGE_URL="https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o/${ENCODED_NAME}?alt=media"
  fi

  echo "Linking ${IMAGE_NAME}..."

  # Create the document in Firestore using the REST API
  # This is much more reliable than the gcloud firestore command
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
