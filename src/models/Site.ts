export interface Site {
  id: string;
  url: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SiteCheck {
  id: string;
  siteId: string;
  timestamp: string;
  status: number;
  responseTime: number;
  success: boolean;
  error?: string;
}

export interface SiteStatus {
  site: Site;
  lastCheck?: SiteCheck;
  uptimePercentage?: number;
  averageResponseTime?: number;
  checks?: SiteCheck[];
}

export interface UptimeRange {
  startTime: string;
  endTime: string;
}
