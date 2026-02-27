#!/bin/bash

# Configuration for R & W Property Solutions
PROJECT_ID="studio-3066782500-b50dd"
BUCKET_NAME="studio-3066782500-b50dd.firebasestorage.app"
COLLECTION_NAME="gallery_images"

echo "Starting image sync for project: ${PROJECT_ID}..."

# Get the list of images from the root of the storage bucket
# Using gsutil which is the most reliable way for bulk operations
IMAGES=$(gsutil ls gs://${BUCKET_NAME}/)

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
  DESCRIPTION=$(echo "$IMAGE_NAME" | cut -f 1 -d '.')

  # Construct the public URL for Firebase Storage
  IMAGE_URL="https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o/${IMAGE_NAME}?alt=media"

  echo "Linking ${IMAGE_NAME}..."

  # Add the image to Firestore. 
  # We write to both 'url' and 'imageUrl' for max compatibility with the UI.
  gcloud firestore documents write "${COLLECTION_NAME}/${IMAGE_NAME}" \
    --project "${PROJECT_ID}" \
    --values="url=${IMAGE_URL},imageUrl=${IMAGE_URL},description=${DESCRIPTION},uploadedAt=server_timestamp()"

done

echo "Sync complete! Refresh your website gallery to see your project photos live."