import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  PutCommandInput,
  GetCommand, 
  GetCommandInput,
  UpdateCommand, 
  UpdateCommandInput,
  DeleteCommand, 
  DeleteCommandInput,
  ScanCommand, 
  ScanCommandInput,
  QueryCommand,
  QueryCommandInput
} from '@aws-sdk/lib-dynamodb';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { v4 as uuidv4 } from 'uuid';
import { Site, SiteCheck, SiteStatus, UptimeRange } from '../models/Site';
import { Logger } from '../utils/Logger';

export class DatabaseService {
  private dynamoDbClient: DynamoDBClient;
  private documentClient: DynamoDBDocumentClient;
  private sitesTable: string;
  private checksTable: string;
  private logger: Logger;

  constructor(
    region: string, 
    tablePrefix: string,
    logger: Logger
  ) {
    const clientConfig: DynamoDBClientConfig = { 
      region,
      credentials: fromNodeProviderChain()
    };
    
    // If running locally with DynamoDB local
    const endpoint = process.env.AWS_ENDPOINT_URL;
    if (endpoint) {
      clientConfig.endpoint = endpoint;
      // For local development, we still need some credentials
      clientConfig.credentials = {
        accessKeyId: 'local',
        secretAccessKey: 'local'
      };
    }

    this.dynamoDbClient = new DynamoDBClient(clientConfig);
    this.documentClient = DynamoDBDocumentClient.from(this.dynamoDbClient);
    this.sitesTable = `${tablePrefix}sites`;
    this.checksTable = `${tablePrefix}checks`;
    this.logger = logger;
  }

  // Site methods
  public async createSite(site: Omit<Site, 'id' | 'createdAt' | 'updatedAt'>): Promise<Site> {
    const timestamp = new Date().toISOString();
    
    const newSite: Site = {
      id: uuidv4(),
      ...site,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    const params: PutCommandInput = {
      TableName: this.sitesTable,
      Item: newSite
    };

    try {
      await this.documentClient.send(new PutCommand(params));
      this.logger.info(`Created site: ${newSite.name} (${newSite.url})`);
      return newSite;
    } catch (error) {
      this.logger.error('Error creating site:', error);
      throw error;
    }
  }

  public async getSite(id: string): Promise<Site | null> {
    const params: GetCommandInput = {
      TableName: this.sitesTable,
      Key: { id }
    };

    try {
      const result = await this.documentClient.send(new GetCommand(params));
      return result.Item as Site || null;
    } catch (error) {
      this.logger.error(`Error getting site with ID ${id}:`, error);
      throw error;
    }
  }

  public async updateSite(id: string, updates: Partial<Omit<Site, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Site | null> {
    const site = await this.getSite(id);
    
    if (!site) {
      return null;
    }

    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.entries(updates).forEach(([key, value]) => {
      updateExpressions.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
    });

    // Add updatedAt field
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const params: UpdateCommandInput = {
      TableName: this.sitesTable,
      Key: { id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    try {
      const result = await this.documentClient.send(new UpdateCommand(params));
      this.logger.info(`Updated site with ID ${id}`);
      return result.Attributes as Site;
    } catch (error) {
      this.logger.error(`Error updating site with ID ${id}:`, error);
      throw error;
    }
  }

  public async deleteSite(id: string): Promise<boolean> {
    const params: DeleteCommandInput = {
      TableName: this.sitesTable,
      Key: { id }
    };

    try {
      await this.documentClient.send(new DeleteCommand(params));
      this.logger.info(`Deleted site with ID ${id}`);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting site with ID ${id}:`, error);
      throw error;
    }
  }

  public async getAllSites(): Promise<Site[]> {
    const params: ScanCommandInput = {
      TableName: this.sitesTable
    };

    try {
      const result = await this.documentClient.send(new ScanCommand(params));
      return (result.Items || []) as Site[];
    } catch (error) {
      this.logger.error('Error getting all sites:', error);
      throw error;
    }
  }

  // Site check methods
  public async saveSiteCheck(check: Omit<SiteCheck, 'id'>): Promise<SiteCheck> {
    const newCheck: SiteCheck = {
      id: uuidv4(),
      ...check
    };

    const params: PutCommandInput = {
      TableName: this.checksTable,
      Item: newCheck
    };

    try {
      await this.documentClient.send(new PutCommand(params));
      return newCheck;
    } catch (error) {
      this.logger.error('Error saving site check:', error);
      throw error;
    }
  }

  public async getSiteChecks(siteId: string, limit: number = 100): Promise<SiteCheck[]> {
    const params: QueryCommandInput = {
      TableName: this.checksTable,
      IndexName: 'siteId-timestamp-index',
      KeyConditionExpression: 'siteId = :siteId',
      ExpressionAttributeValues: {
        ':siteId': siteId
      },
      ScanIndexForward: false, // Descending order (newest first)
      Limit: limit
    };

    try {
      const result = await this.documentClient.send(new QueryCommand(params));
      return (result.Items || []) as SiteCheck[];
    } catch (error) {
      this.logger.error(`Error getting checks for site ${siteId}:`, error);
      throw error;
    }
  }

  public async getSiteChecksBetweenDates(
    siteId: string, 
    startTime: string, 
    endTime: string
  ): Promise<SiteCheck[]> {
    const params: QueryCommandInput = {
      TableName: this.checksTable,
      IndexName: 'siteId-timestamp-index',
      KeyConditionExpression: 'siteId = :siteId AND timestamp BETWEEN :startTime AND :endTime',
      ExpressionAttributeValues: {
        ':siteId': siteId,
        ':startTime': startTime,
        ':endTime': endTime
      }
    };

    try {
      const result = await this.documentClient.send(new QueryCommand(params));
      return (result.Items || []) as SiteCheck[];
    } catch (error) {
      this.logger.error(`Error getting checks for site ${siteId} between dates:`, error);
      throw error;
    }
  }

  public async getSiteStatus(siteId: string): Promise<SiteStatus | null> {
    const site = await this.getSite(siteId);
    
    if (!site) {
      return null;
    }

    // Get the most recent check
    const checks = await this.getSiteChecks(siteId, 1);
    const lastCheck = checks.length > 0 ? checks[0] : undefined;

    // Get checks from the last 24 hours for uptime calculation
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentChecks = await this.getSiteChecksBetweenDates(
      siteId,
      yesterday.toISOString(),
      new Date().toISOString()
    );

    // Calculate uptime percentage
    const uptimePercentage = recentChecks.length > 0
      ? (recentChecks.filter(check => check.success).length / recentChecks.length) * 100
      : undefined;

    // Calculate average response time
    const totalResponseTime = recentChecks.reduce((sum, check) => sum + check.responseTime, 0);
    const averageResponseTime = recentChecks.length > 0
      ? totalResponseTime / recentChecks.length
      : undefined;

    return {
      site,
      lastCheck,
      uptimePercentage,
      averageResponseTime,
      checks: recentChecks
    };
  }

  public async calculateUptimePercentage(
    siteId: string, 
    { startTime, endTime }: UptimeRange
  ): Promise<number | null> {
    const checks = await this.getSiteChecksBetweenDates(siteId, startTime, endTime);
    
    if (checks.length === 0) {
      return null;
    }
    
    const successfulChecks = checks.filter(check => check.success);
    return (successfulChecks.length / checks.length) * 100;
  }
}
