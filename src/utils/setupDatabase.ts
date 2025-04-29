import {
  DynamoDB,
  CreateTableCommand,
  ResourceInUseException,
  CreateTableCommandInput,
  KeySchemaElement,
  AttributeDefinition,
} from "@aws-sdk/client-dynamodb";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Environment variables
const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const DYNAMODB_TABLE_PREFIX =
  process.env.DYNAMODB_TABLE_PREFIX || "uptime_robot_";

// DynamoDB client configuration
const options = {
  region: AWS_REGION,
  credentials: fromNodeProviderChain(),
};

// If running locally with DynamoDB local
const endpoint = process.env.AWS_ENDPOINT_URL;
if (endpoint) {
  // options.endpoint = endpoint;
  // For local development, we still need some credentials
  // options.credentials = {
  // accessKeyId: 'local',
  // secretAccessKey: 'local'
  // };
}

const dynamodb = new DynamoDB(options);

// Table names
const sitesTable = `${DYNAMODB_TABLE_PREFIX}sites`;
const checksTable = `${DYNAMODB_TABLE_PREFIX}checks`;

async function createSitesTable() {
  const keySchema: KeySchemaElement[] = [
    { AttributeName: "id", KeyType: "HASH" },
  ];

  const attributeDefinitions: AttributeDefinition[] = [
    { AttributeName: "id", AttributeType: "S" },
  ];

  const params: CreateTableCommandInput = {
    TableName: sitesTable,
    KeySchema: keySchema,
    AttributeDefinitions: attributeDefinitions,
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };

  try {
    console.log(`Creating table: ${sitesTable}`);
    await dynamodb.send(new CreateTableCommand(params));
    console.log(`Table created: ${sitesTable}`);
  } catch (error: any) {
    if (error instanceof ResourceInUseException) {
      console.log(`Table already exists: ${sitesTable}`);
    } else {
      console.error(`Error creating table ${sitesTable}:`, error);
      throw error;
    }
  }
}

async function createChecksTable() {
  const keySchema: KeySchemaElement[] = [
    { AttributeName: "id", KeyType: "HASH" },
  ];

  const attributeDefinitions: AttributeDefinition[] = [
    { AttributeName: "id", AttributeType: "S" },
    { AttributeName: "siteId", AttributeType: "S" },
    { AttributeName: "timestamp", AttributeType: "S" },
  ];

  const params: CreateTableCommandInput = {
    TableName: checksTable,
    KeySchema: keySchema,
    AttributeDefinitions: attributeDefinitions,
    GlobalSecondaryIndexes: [
      {
        IndexName: "siteId-timestamp-index",
        KeySchema: [
          { AttributeName: "siteId", KeyType: "HASH" },
          { AttributeName: "timestamp", KeyType: "RANGE" },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };

  try {
    console.log(`Creating table: ${checksTable}`);
    await dynamodb.send(new CreateTableCommand(params));
    console.log(`Table created: ${checksTable}`);
  } catch (error: any) {
    if (error instanceof ResourceInUseException) {
      console.log(`Table already exists: ${checksTable}`);
    } else {
      console.error(`Error creating table ${checksTable}:`, error);
      throw error;
    }
  }
}

async function setupDatabase() {
  try {
    await createSitesTable();
    await createChecksTable();
    console.log("Database setup complete");
  } catch (error) {
    console.error("Database setup failed:", error);
    process.exit(1);
  }
}

// Execute if this script is run directly
if (require.main === module) {
  setupDatabase();
}

export default setupDatabase;
