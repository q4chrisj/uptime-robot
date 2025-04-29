import { MonitoringService } from '../../src/services/MonitoringService';
import { DatabaseService } from '../../src/services/DatabaseService';
import { Logger } from '../../src/utils/Logger';
import { Site, SiteCheck } from '../../src/models/Site';
import axios from 'axios';

// Mock dependencies
jest.mock('axios');
jest.mock('../../src/services/DatabaseService');
jest.mock('../../src/utils/Logger');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const MockedDatabaseService = DatabaseService as jest.MockedClass<typeof DatabaseService>;
const MockedLogger = Logger as jest.MockedClass<typeof Logger>;

describe('MonitoringService', () => {
  let monitoringService: MonitoringService;
  let databaseService: jest.Mocked<DatabaseService>;
  let logger: jest.Mocked<Logger>;

  const mockSite: Site = {
    id: 'test-site-1',
    url: 'https://example.com',
    name: 'Example Site',
    active: true,
    createdAt: '2023-05-01T12:00:00Z',
    updatedAt: '2023-05-01T12:00:00Z'
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock instances
    databaseService = new MockedDatabaseService() as jest.Mocked<DatabaseService>;
    logger = new MockedLogger() as jest.Mocked<Logger>;
    
    // Create service instance
    monitoringService = new MonitoringService(databaseService, logger, 1000);
  });

  describe('checkSite', () => {
    it('should handle successful site check', async () => {
      // Mock successful response
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: 'OK'
      });
      
      // Mock database save
      databaseService.saveSiteCheck = jest.fn().mockImplementation((check: SiteCheck) => 
        Promise.resolve(check)
      );

      // Perform check
      const result = await monitoringService.checkSite(mockSite);

      // Assertions
      expect(mockedAxios.get).toHaveBeenCalledWith(mockSite.url, expect.any(Object));
      expect(result.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.siteId).toBe(mockSite.id);
      expect(databaseService.saveSiteCheck).toHaveBeenCalledWith(expect.objectContaining({
        siteId: mockSite.id,
        status: 200,
        success: true
      }));
    });

    it('should handle failed site check', async () => {
      // Mock failed response
      mockedAxios.get.mockResolvedValue({
        status: 500,
        data: 'Server Error'
      });
      
      // Mock database save
      databaseService.saveSiteCheck = jest.fn().mockImplementation((check: SiteCheck) => 
        Promise.resolve(check)
      );

      // Perform check
      const result = await monitoringService.checkSite(mockSite);

      // Assertions
      expect(mockedAxios.get).toHaveBeenCalledWith(mockSite.url, expect.any(Object));
      expect(result.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(databaseService.saveSiteCheck).toHaveBeenCalledWith(expect.objectContaining({
        siteId: mockSite.id,
        status: 500,
        success: false
      }));
    });

    it('should handle network errors', async () => {
      // Mock network error
      const networkError = new Error('Network Error');
      mockedAxios.get.mockRejectedValue(networkError);
      
      // Mock database save
      databaseService.saveSiteCheck = jest.fn().mockImplementation((check: SiteCheck) => 
        Promise.resolve(check)
      );

      // Perform check
      const result = await monitoringService.checkSite(mockSite);

      // Assertions
      expect(mockedAxios.get).toHaveBeenCalledWith(mockSite.url, expect.any(Object));
      expect(result.status).toBe(0);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(databaseService.saveSiteCheck).toHaveBeenCalledWith(expect.objectContaining({
        siteId: mockSite.id,
        success: false
      }));
    });
  });

  describe('checkAllSites', () => {
    it('should check all active sites', async () => {
      // Mock sites in database
      const mockSites: Site[] = [
        mockSite,
        {
          ...mockSite,
          id: 'test-site-2',
          name: 'Another Site',
          url: 'https://another.com'
        },
        {
          ...mockSite,
          id: 'test-site-3',
          name: 'Inactive Site',
          url: 'https://inactive.com',
          active: false
        }
      ];

      databaseService.getAllSites = jest.fn().mockResolvedValue(mockSites);
      
      // Mock the checkSite method
      const checkSiteSpy = jest.spyOn(monitoringService, 'checkSite')
        .mockImplementation((site: Site) => 
          Promise.resolve({
            id: `check-${site.id}`,
            siteId: site.id,
            timestamp: new Date().toISOString(),
            status: 200,
            responseTime: 100,
            success: true
          })
        );

      // Perform check all
      await monitoringService.checkAllSites();

      // Assertions
      expect(databaseService.getAllSites).toHaveBeenCalled();
      expect(checkSiteSpy).toHaveBeenCalledTimes(2); // Only active sites
      expect(checkSiteSpy).toHaveBeenCalledWith(mockSites[0]);
      expect(checkSiteSpy).toHaveBeenCalledWith(mockSites[1]);
      expect(checkSiteSpy).not.toHaveBeenCalledWith(mockSites[2]); // Inactive site should be skipped
    });
  });
});
