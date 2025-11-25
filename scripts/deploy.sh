#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="minori-477714"
REGION="asia-northeast1"
FRONTEND_SERVICE="minori-frontend"
BACKEND_SERVICE="minori-backend"

echo -e "${GREEN}=== Minori Deployment Script ===${NC}"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Check required secrets
echo -e "${YELLOW}Checking required secrets...${NC}"
REQUIRED_SECRETS=("RAILS_MASTER_KEY" "DB_PASSWORD" "SECRET_KEY_BASE")
for secret in "${REQUIRED_SECRETS[@]}"; do
    if gcloud secrets describe "$secret" --project="$PROJECT_ID" &>/dev/null; then
        echo -e "${GREEN}✓${NC} $secret exists"
    else
        echo -e "${RED}✗${NC} $secret is missing"
        echo "Please create the secret with: gcloud secrets create $secret --project=$PROJECT_ID"
        exit 1
    fi
done

echo ""

# Parse command line arguments
COMPONENT="${1:-all}"

deploy_frontend() {
    echo -e "${GREEN}=== Deploying Frontend ===${NC}"

    # Get current git commit SHA
    GIT_SHA=$(git rev-parse --short HEAD)
    echo "Using git SHA: $GIT_SHA"

    # Build and push frontend
    gcloud builds submit ./frontend \
        --config=./frontend/cloudbuild.yaml \
        --project="$PROJECT_ID" \
        --substitutions=_SHORT_SHA="$GIT_SHA",_VITE_API_URL="https://minori-backend-336192862447.asia-northeast1.run.app"

    echo -e "${GREEN}✓ Frontend deployed successfully${NC}"
    echo "URL: https://minori-frontend-336192862447.asia-northeast1.run.app"
}

deploy_backend() {
    echo -e "${GREEN}=== Deploying Backend ===${NC}"

    # Get current git commit SHA
    GIT_SHA=$(git rev-parse --short HEAD)
    echo "Using git SHA: $GIT_SHA"

    # Build and push backend
    gcloud builds submit ./backend \
        --config=./backend/cloudbuild.yaml \
        --project="$PROJECT_ID" \
        --substitutions=_SHORT_SHA="$GIT_SHA"

    echo -e "${GREEN}✓ Backend deployed successfully${NC}"
    echo "URL: https://minori-backend-336192862447.asia-northeast1.run.app"
}

# Execute deployment based on argument
case "$COMPONENT" in
    frontend)
        deploy_frontend
        ;;
    backend)
        deploy_backend
        ;;
    all)
        deploy_backend
        deploy_frontend
        ;;
    *)
        echo -e "${RED}Invalid component: $COMPONENT${NC}"
        echo "Usage: $0 [frontend|backend|all]"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
