#!/bin/bash

# Configuration for R & W Property Solutions
PROJECT_ID="studio-3066782500-b50dd"
BUCKET_NAME="studio-3066782500-b50dd.firebasestorage.app"
COLLECTION_NAME="gallery_images"

echo "Starting high-speed cinematic gallery sync for project: ${PROJECT_ID}..."
echo "Scanning storage bucket: gs://${BUCKET_NAME}"

# 1. Verify Authentication and get token
TOKEN=$(gcloud auth print-access-token 2>/dev/null)
if [ -z "$TOKEN" ]; then
    echo "Error: Not authenticated. Please run 'gcloud auth login' first."
    exit 1
fi

# 2. List images from the storage bucket
IMAGES=$(gsutil ls gs://${BUCKET_NAME}/** 2>/dev/null)
if [ -z "$IMAGES" ]; then
    echo "No images found in your Storage bucket."
    echo "Please upload some project photos to gs://${BUCKET_NAME}/ first."
    exit 1
fi

echo "Images found. Synchronizing to Cinematic Gallery database..."

for IMAGE in $IMAGES
do
  # Skip directories
  [[ $IMAGE == */ ]] && continue

  IMAGE_NAME=$(basename "$IMAGE")
  
  # Clean up the name for the title/description
  TITLE="Project Update"
  DESCRIPTION=$(echo "$IMAGE_NAME" | cut -f 1 -d '.' | tr '_' ' ' | tr '-' ' ')

  # Construct the direct URL
  ENCODED_NAME=$(echo "$IMAGE_NAME" | sed 's/ /%20/g')
  IMAGE_URL="https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o/${ENCODED_NAME}?alt=media"

  # Create a unique document ID from the image name to prevent duplicates (idempotency)
  DOC_ID=$(echo "$IMAGE_NAME" | sed 's/[^a-zA-Z0-9]/_/g')

  echo "Syncing: ${IMAGE_NAME}..."

  # Use the REST API with PATCH to update or create (upsert) the document by ID.
  # This prevents the "244 images" problem by ensuring each photo only has ONE database record.
  curl -s -X PATCH "https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION_NAME}/${DOC_ID}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"fields\": {
        \"url\": { \"stringValue\": \"${IMAGE_URL}\" },
        \"imageUrl\": { \"stringValue\": \"${IMAGE_URL}\" },
        \"title\": { \"stringValue\": \"${TITLE}\" },
        \"description\": { \"stringValue\": \"${DESCRIPTION}\" },
        \"uploadedAt\": { \"timestampValue\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\" },
        \"order\": { \"integerValue\": \"$(date +%s)\" }
      }
    }" > /dev/null

done

echo "Sync complete! Refresh your website to see the cinematic gallery updated with your photos."
