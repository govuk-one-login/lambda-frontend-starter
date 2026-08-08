import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import type {
  DeleteCommandInput,
  GetCommandInput,
  UpdateCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { getAwsClientConfig } from "../getAwsClientConfig/index.js";
import * as AWSXRay from "aws-xray-sdk";
import { getEnvironment } from "../../getEnvironment/index.js";

const createDynamoDbClient = () => {
  const dynamoDbClient = new DynamoDBClient(getAwsClientConfig());

  const wrappedClient =
    getEnvironment() === "local"
      ? dynamoDbClient
      : AWSXRay.captureAWSv3Client(dynamoDbClient);

  const docClient = DynamoDBDocumentClient.from(wrappedClient, {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  });

  const client = {
    client: docClient,
    config: docClient.config,
    get: async (params: GetCommandInput) => {
      const { GetCommand } = await import("@aws-sdk/lib-dynamodb");
      return await docClient.send(new GetCommand(params));
    },
    delete: async (params: DeleteCommandInput) => {
      const { DeleteCommand } = await import("@aws-sdk/lib-dynamodb");
      return await docClient.send(new DeleteCommand(params));
    },
    update: async (params: UpdateCommandInput) => {
      const { UpdateCommand } = await import("@aws-sdk/lib-dynamodb");
      return await docClient.send(new UpdateCommand(params));
    },
  };
  return client;
};

let cachedDynamoDbClient: ReturnType<typeof createDynamoDbClient> | undefined;
const getDynamoDbClient = (): ReturnType<typeof createDynamoDbClient> => {
  cachedDynamoDbClient ??= createDynamoDbClient();
  return cachedDynamoDbClient;
};

export { getDynamoDbClient };
