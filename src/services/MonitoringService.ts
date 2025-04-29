import axios, { AxiosResponse } from 'axios';
import { Site, SiteCheck } from '../models/Site';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from './DatabaseService';
import { Logger } from '../utils/Logger';

export class MonitoringService {
  private databaseService: DatabaseService;
  private logger: Logger;
  private timeoutMs: number;

  constructor(databaseService: DatabaseService, logger: Logger, timeoutMs: number = 5000) {
    this.databaseService = databaseService;
    this.logger = logger;
    this.timeoutMs = timeoutMs;
  }

  public async checkAllSites(): Promise<void> {
    try {
      const sites = await this.databaseService.getAllSites();
      
      this.logger.info(`Starting check for ${sites.length} sites`);
      
      const checkPromises = sites
        .filter(site => site.active)
        .map(site => this.checkSite(site));
      
      await Promise.all(checkPromises);
      
      this.logger.info('Completed checking all sites');
    } catch (error) {
      this.logger.error('Error checking sites', error);
      throw error;
    }
  }

  public async checkSite(site: Site): Promise<SiteCheck> {
    const startTime = Date.now();
    let status = 0;
    let success = false;
    let errorMessage: string | undefined;
    
    try {
      this.logger.debug(`Checking site: ${site.name} (${site.url})`);
      
      const response: AxiosResponse = await axios.get(site.url, {
        timeout: this.timeoutMs,
        validateStatus: () => true // Accept any status code
      });
      
      status = response.status;
      success = status >= 200 && status < 300;
      
      if (!success) {
        errorMessage = `Received status code ${status}`;
      }
    } catch (error: any) {
      errorMessage = error.message || 'Unknown error';
      this.logger.error(`Error checking site ${site.url}:`, error);
    }
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const siteCheck: SiteCheck = {
      id: uuidv4(),
      siteId: site.id,
      timestamp: new Date().toISOString(),
      status,
      responseTime,
      success,
      error: errorMessage
    };
    
    await this.databaseService.saveSiteCheck(siteCheck);
    
    this.logger.info(`Check completed for ${site.url}: Status ${status}, Response time: ${responseTime}ms, Success: ${success}`);
    
    return siteCheck;
  }
}
