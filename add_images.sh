#!/bin/bash

# Configuration for R & W Property Solutions
PROJECT_ID="studio-3066782500-b50dd"
BUCKET_NAME="studio-3066782500-b50dd.firebasestorage.app"
COLLECTION_NAME="gallery_images"

echo "Starting image sync for project: ${PROJECT_ID}..."

# Get the list of images from the root of the storage bucket
# Using gsutil which is the most reliable way for bulk operations
IMAGES=$(gsutil ls gs://${BUCKET_NAME}/gallery_images/ 2>/dev/null || gsutil ls gs://${BUCKET_NAME}/)

if [ -z "$IMAGES" ]; then
    echo "No images found in gs://${BUCKET_NAME}/"
    echo "Please upload images to your storage bucket first."
    exit 1
fi

echo "Found images. Syncing to Firestore..."

# Loop through each image and add it to Firestore
for IMAGE in $IMAGES
do
  # Skip directories
  if [[ $IMAGE == */ ]]; then
    continue
  fi

  # Get the image file name
  IMAGE_NAME=$(basename $IMAGE)
  
  # Clean up the name for the description (remove extension)
  DESCRIPTION=$(echo "$IMAGE_NAME" | cut -f 1 -d '.' | tr '_' ' ')

  # Construct the public URL for Firebase Storage
  IMAGE_URL="https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o/gallery_images%2F${IMAGE_NAME}?alt=media"
  
  # If it was in the root, handle that too
  if [[ $IMAGE != *gallery_images* ]]; then
    IMAGE_URL="https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o/${IMAGE_NAME}?alt=media"
  fi

  echo "Linking ${IMAGE_NAME}..."

  # Add the image to Firestore using gcloud.
  # We set both 'url' and 'imageUrl' for max compatibility.
  gcloud firestore documents create \
    --project "${PROJECT_ID}" \
    --collection-path="${COLLECTION_NAME}" \
    --data="{\"url\":\"${IMAGE_URL}\",\"imageUrl\":\"${IMAGE_URL}\",\"description\":\"${DESCRIPTION}\",\"uploadedAt\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"

done

echo "Sync complete! Refresh your website to see the gallery updated."