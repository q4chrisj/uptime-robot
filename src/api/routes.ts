import express, { Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { MonitoringService } from '../services/MonitoringService';
import { Logger } from '../utils/Logger';
import { Site, UptimeRange } from '../models/Site';

export function setupRoutes(
  app: express.Application,
  databaseService: DatabaseService,
  monitoringService: MonitoringService,
  logger: Logger
): void {
  const router = express.Router();

  // Health check endpoint
  router.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Sites endpoints
  router.get('/sites', async (req: Request, res: Response) => {
    try {
      const sites = await databaseService.getAllSites();
      res.status(200).json(sites);
    } catch (error) {
      logger.error('Error getting all sites:', error);
      res.status(500).json({ error: 'Failed to retrieve sites' });
    }
  });

  router.get('/sites/:id', async (req: Request, res: Response) => {
    try {
      const site = await databaseService.getSite(req.params.id);
      
      if (!site) {
        return res.status(404).json({ error: 'Site not found' });
      }
      
      res.status(200).json(site);
    } catch (error) {
      logger.error(`Error getting site ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to retrieve site' });
    }
  });

  router.post('/sites', async (req: Request, res: Response) => {
    try {
      const { url, name, active } = req.body;
      
      if (!url || !name) {
        return res.status(400).json({ error: 'URL and name are required' });
      }
      
      const newSite = await databaseService.createSite({
        url,
        name,
        active: active !== undefined ? active : true
      });
      
      res.status(201).json(newSite);
    } catch (error) {
      logger.error('Error creating site:', error);
      res.status(500).json({ error: 'Failed to create site' });
    }
  });

  router.put('/sites/:id', async (req: Request, res: Response) => {
    try {
      const { url, name, active } = req.body;
      const updates: Partial<Site> = {};
      
      if (url !== undefined) updates.url = url;
      if (name !== undefined) updates.name = name;
      if (active !== undefined) updates.active = active;
      
      const updatedSite = await databaseService.updateSite(req.params.id, updates);
      
      if (!updatedSite) {
        return res.status(404).json({ error: 'Site not found' });
      }
      
      res.status(200).json(updatedSite);
    } catch (error) {
      logger.error(`Error updating site ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to update site' });
    }
  });

  router.delete('/sites/:id', async (req: Request, res: Response) => {
    try {
      const success = await databaseService.deleteSite(req.params.id);
      
      if (!success) {
        return res.status(404).json({ error: 'Site not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      logger.error(`Error deleting site ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to delete site' });
    }
  });

  // Status endpoints
  router.get('/sites/:id/status', async (req: Request, res: Response) => {
    try {
      const status = await databaseService.getSiteStatus(req.params.id);
      
      if (!status) {
        return res.status(404).json({ error: 'Site not found' });
      }
      
      res.status(200).json(status);
    } catch (error) {
      logger.error(`Error getting status for site ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to retrieve site status' });
    }
  });

  router.get('/sites/:id/checks', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const checks = await databaseService.getSiteChecks(req.params.id, limit);
      res.status(200).json(checks);
    } catch (error) {
      logger.error(`Error getting checks for site ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to retrieve site checks' });
    }
  });

  router.get('/sites/:id/uptime', async (req: Request, res: Response) => {
    try {
      const startTime = req.query.startTime as string;
      const endTime = req.query.endTime as string;
      
      if (!startTime || !endTime) {
        return res.status(400).json({ error: 'startTime and endTime query parameters are required' });
      }
      
      const uptimeRange: UptimeRange = { startTime, endTime };
      const percentage = await databaseService.calculateUptimePercentage(req.params.id, uptimeRange);
      
      if (percentage === null) {
        return res.status(404).json({ error: 'No data available for the specified time range' });
      }
      
      res.status(200).json({ 
        siteId: req.params.id, 
        startTime, 
        endTime, 
        uptimePercentage: percentage 
      });
    } catch (error) {
      logger.error(`Error calculating uptime for site ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to calculate uptime percentage' });
    }
  });

  // Manual check endpoint
  router.post('/sites/:id/check', async (req: Request, res: Response) => {
    try {
      const site = await databaseService.getSite(req.params.id);
      
      if (!site) {
        return res.status(404).json({ error: 'Site not found' });
      }
      
      const check = await monitoringService.checkSite(site);
      res.status(200).json(check);
    } catch (error) {
      logger.error(`Error manually checking site ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to check site' });
    }
  });

  app.use('/api', router);
}
