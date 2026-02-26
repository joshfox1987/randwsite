#!/bin/bash

PROJECT_ID="studio-3066782500-b50dd"
COLLECTION_NAME="gallery_images"

# Get the list of images from Firebase Storage
IMAGES=$(gsutil ls gs://studio-3066782500-b50dd.firebasestorage.app/gallery_images/)

# Loop through each image and add it to Firestore
for IMAGE in $IMAGES
do
  # Get the image file name
  IMAGE_NAME=$(basename $IMAGE)

  # Construct the public URL
  IMAGE_URL="https://firebasestorage.googleapis.com/v0/b/studio-3066782500-b50dd.appspot.com/o/gallery_images%2F${IMAGE_NAME}?alt=media"

  # Add the image to Firestore
  gcloud firestore documents write "${COLLECTION_NAME}/${IMAGE_NAME}" "url=${IMAGE_URL}" --project "${PROJECT_ID}"
done