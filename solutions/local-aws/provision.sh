#!/bin/bash

set -e

export AWS_PAGER=""
export AWS_ACCESS_KEY_ID="test"
export AWS_SECRET_ACCESS_KEY="test" # pragma: allowlist secret
export AWS_DEFAULT_REGION="eu-west-2"

EMULATOR_ENDPOINT="https://localhost:9297"
STACK_NAME="changeme" # The value should be the same as the value of AWS::StackName in solutions/app-infra/template.yaml
DOCKER_NETWORK_NAME="$STACK_NAME-network"
EMULATOR_CONTAINER_NAME="$STACK_NAME-aws-emulator"

create_docker_network() {
  echo "Creating Docker network"

  docker network create "$DOCKER_NETWORK_NAME" || true

  echo "Docker network created"
  return 0
}

build_images() {
  echo "Building Docker images"

  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

  case "$(uname -m)" in
    arm64|aarch64) RPM_ARCH="aarch64" ;;
    *) RPM_ARCH="x86_64" ;;
  esac

  docker build -t "$EMULATOR_CONTAINER_NAME" --build-arg RPM_ARCH="$RPM_ARCH" -f "$SCRIPT_DIR/aws-emulator/Dockerfile" "$SCRIPT_DIR"

  echo "Finished building Docker images"
  return 0
}

start_aws_emulator() {
  echo "Starting AWS Emulator"

  docker stop "$EMULATOR_CONTAINER_NAME" || true && docker rm "$EMULATOR_CONTAINER_NAME" || true
  docker run -d \
    -p 9297:9297 \
    --network "$DOCKER_NETWORK_NAME" \
    --name "$EMULATOR_CONTAINER_NAME" \
    "$EMULATOR_CONTAINER_NAME" \
    --auth off

  until curl -sf --insecure "$EMULATOR_ENDPOINT/__admin/health" > /dev/null 2>&1; do
    echo "⌛ AWS Emulator not ready yet, retrying in 2s"
    sleep 2
  done

  echo "AWS Emulator is ready"
  return 0
}

create_dynamodb_tables() {
  echo "Creating DynamoDB tables"

  aws --endpoint-url="$EMULATOR_ENDPOINT" --no-verify-ssl dynamodb create-table \
    --table-name "$STACK_NAME-SessionStore" \
    --attribute-definitions \
      AttributeName=id,AttributeType=S \
    --key-schema \
      AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST

  aws --endpoint-url="$EMULATOR_ENDPOINT" --no-verify-ssl dynamodb wait table-exists \
    --table-name "$STACK_NAME-SessionStore"

  aws --endpoint-url="$EMULATOR_ENDPOINT" --no-verify-ssl dynamodb update-time-to-live \
    --table-name "$STACK_NAME-SessionStore" \
    --time-to-live-specification "Enabled=true,AttributeName=expires"

  echo "Finished creating DynamoDB tables"
  return 0
}

create_docker_network
build_images
start_aws_emulator
create_dynamodb_tables

echo "Local AWS provisioned successfully"
