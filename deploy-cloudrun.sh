#!/usr/bin/env bash
set -e

SERVICE_NAME="accessiq"
REGION="asia-south1" # Mumbai, India (Lowest latency & GovTech data compliance)
PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "trisphere-4b121")

echo "========================================================"
echo "🚀 Deploying AccessIQ to Google Cloud Run"
echo "========================================================"
echo "Project ID  : ${PROJECT_ID}"
echo "Service Name: ${SERVICE_NAME}"
echo "Region      : ${REGION}"
echo "========================================================"

# 1. Enable required Google Cloud APIs if not already enabled
echo "Enabling Cloud Run and Cloud Build APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com --project="${PROJECT_ID}"

# 2. Deploy from source code (Google Cloud Build will package the Dockerfile)
echo "Deploying container image to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --source . \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 1 \
  --timeout 300 \
  --set-env-vars DATABASE_URL="file:../data/accessiq.db" \
  --min-instances 0 \
  --max-instances 5

echo ""
echo "========================================================"
echo "✅ AccessIQ successfully deployed to Google Cloud Run!"
echo "========================================================"
gcloud run services describe "${SERVICE_NAME}" --project="${PROJECT_ID}" --region="${REGION}" --format="value(status.url)"
