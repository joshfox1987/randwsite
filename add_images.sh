#!/bin/bash

PROJECT_ID="studio-3066782500-b50dd"
COLLECTION_NAME="gallery_images"

# Get the list of images from Firebase Storage
# Make sure the path matches where you uploaded them
IMAGES=$(gsutil ls gs://studio-3066782500-b50dd.firebasestorage.app/gallery_images/)

echo "Found images: $IMAGES"

# Loop through each image and add it to Firestore
for IMAGE in $IMAGES
do
  # Get the image file name
  IMAGE_NAME=$(basename $IMAGE)

  # Construct the public URL using the firebasestorage domain
  IMAGE_URL="https://firebasestorage.googleapis.com/v0/b/studio-3066782500-b50dd.appspot.com/o/gallery_images%2F${IMAGE_NAME}?alt=media"

  echo "Syncing ${IMAGE_NAME}..."

  # Add the image to Firestore using 'url' and 'imageUrl' for max compatibility
  gcloud firestore documents write "${COLLECTION_NAME}/${IMAGE_NAME}" "url=${IMAGE_URL},imageUrl=${IMAGE_URL},description=${IMAGE_NAME},uploadedAt=server_timestamp()" --project "${PROJECT_ID}"
done

echo "Sync complete!"
