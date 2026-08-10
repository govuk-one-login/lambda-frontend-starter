#!/bin/bash

set -e

export AWS_PAGER=""
export AWS_ACCESS_KEY_ID="test"
export AWS_SECRET_ACCESS_KEY="test" # pragma: allowlist secret
export AWS_DEFAULT_REGION="eu-west-2"

FLOCI_ENDPOINT="http://localhost:4566"
LOCAL_KMS_ENDPOINT="http://localhost:4567"
STACK_NAME="changeme" # The value should be the same as the value of AWS::StackName in solutions/app-infra/template.yaml
DOCKER_NETWORK_NAME="$STACK_NAME-network"
FLOCI_CONTAINER_NAME="$STACK_NAME-floci"
LOCAL_KMS_CONTAINER_NAME="$STACK_NAME-local-kms"

create_docker_network() {
  echo "Creating Docker network"

  docker network create "$DOCKER_NETWORK_NAME" || true

  echo "Docker network created"
  return 0
}

build_images() {
  echo "Building Docker images"

  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  docker build -t "$FLOCI_CONTAINER_NAME" -f "$SCRIPT_DIR/floci/Dockerfile" "$SCRIPT_DIR"
  docker build -t "$LOCAL_KMS_CONTAINER_NAME" -f "$SCRIPT_DIR/local-kms/Dockerfile" "$SCRIPT_DIR"

  echo "Finished building Docker images"
  return 0
}

start_floci() {
  echo "Starting Floci"

  docker stop "$FLOCI_CONTAINER_NAME" || true && docker rm "$FLOCI_CONTAINER_NAME" || true
  docker run -d \
    -p 4566:4566 \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -e FLOCI_DEFAULT_REGION=$AWS_DEFAULT_REGION \
    --network "$DOCKER_NETWORK_NAME" \
    --name "$FLOCI_CONTAINER_NAME" \
    "$FLOCI_CONTAINER_NAME"

  until aws --endpoint-url="$FLOCI_ENDPOINT" s3 ls > /dev/null 2>&1; do
    echo "⌛ Floci not ready yet, retrying in 2s"
    sleep 2
  done

  echo "Floci is ready"
  return 0
}

# It is necessary to to use a separate KMS solution rather than relying on Floci's.
# Floci's KMS solution is buggy and does not work consistently across different machines.
start_kms_local() {
  echo "Starting KMS Local"

  docker stop "$LOCAL_KMS_CONTAINER_NAME" || true && docker rm "$LOCAL_KMS_CONTAINER_NAME" || true
  docker run -d -p 4567:8080 --network "$DOCKER_NETWORK_NAME" --name "$LOCAL_KMS_CONTAINER_NAME" "$LOCAL_KMS_CONTAINER_NAME"

  until aws --endpoint-url="$LOCAL_KMS_ENDPOINT" kms list-keys > /dev/null 2>&1; do
    echo "⌛ KMS Local not ready yet, retrying in 2s"
    sleep 2
  done

  echo "KMS Local is ready"
  return 0
}

create_dynamodb_tables() {
  echo "Creating DynamoDB tables"

  aws --endpoint-url="$FLOCI_ENDPOINT" dynamodb create-table \
    --table-name "$STACK_NAME-SessionStore" \
    --attribute-definitions \
      AttributeName=id,AttributeType=S \
    --key-schema \
      AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST

  aws --endpoint-url="$FLOCI_ENDPOINT" dynamodb update-time-to-live \
    --table-name "$STACK_NAME-SessionStore" \
    --time-to-live-specification "Enabled=true,AttributeName=expires"

  echo "Finished creating DynamoDB tables"
  return 0
}

create_docker_network
build_images
start_floci
start_kms_local
create_dynamodb_tables

echo "Local AWS provisioned successfully"
