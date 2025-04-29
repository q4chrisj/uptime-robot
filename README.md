# Uptime Robot

A TypeScript-based web service that monitors website uptime and provides API access to status information.

## Features

- **Website Monitoring**: Periodically checks the status of configured websites
- **Status Recording**: Records response time, HTTP status, and success/failure
- **RESTful API**: Provides API endpoints to retrieve uptime statistics
- **AWS Integration**: Designed to run on AWS with DynamoDB for storage

## Project Structure

```
uptime-robot/
├── src/                    # Source code
│   ├── api/                # API routes and controllers
│   ├── models/             # Data models and interfaces
│   ├── services/           # Core services
│   └── utils/              # Utilities and helpers
├── tests/                  # Test files
├── scripts/                # Helper scripts
├── .env.example            # Environment variables example
├── package.json            # Project dependencies
└── tsconfig.json           # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js 14+ and npm
- AWS account with appropriate permissions
- AWS CLI configured (for local development)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env` and configure your environment variables:
   ```
   cp .env.example .env
   ```
4. Set up your AWS credentials in the `.env` file or use AWS CLI profiles

### Database Setup

Run the database setup script to create the required DynamoDB tables:

```
npm run build
node scripts/setupDatabase.js
```

### Running the Application

Start the service in development mode:

```
npm run dev
```

Or build and start in production mode:

```
npm run build
npm start
```

## API Endpoints

### Sites Management

- `GET /api/sites` - List all monitored sites
- `GET /api/sites/:id` - Get a specific site
- `POST /api/sites` - Add a new site to monitor
- `PUT /api/sites/:id` - Update a site
- `DELETE /api/sites/:id` - Delete a site

### Status and Checks

- `GET /api/sites/:id/status` - Get current site status and uptime
- `GET /api/sites/:id/checks` - Get historical checks for a site
- `GET /api/sites/:id/uptime` - Calculate uptime percentage for a time range
- `POST /api/sites/:id/check` - Manually trigger a site check

## AWS Configuration

This service is designed to run on AWS and uses the following services:

- **EC2/ECS/Lambda**: For hosting the service
- **DynamoDB**: For storing sites and check results
- **CloudWatch**: For monitoring and logging

## Testing

Run the test suite:

```
npm test
```

## Deployment

### To AWS EC2

1. Set up an EC2 instance with Node.js
2. Clone the repository and install dependencies
3. Configure environment variables in a `.env` file or through instance environment
4. Use a process manager like PM2 to keep the service running:
   ```
   npm install -g pm2
   pm2 start dist/index.js --name "uptime-robot"
   ```

### To AWS ECS/Fargate

1. Build a Docker image for the service
2. Push the image to Amazon ECR
3. Create an ECS task definition and service
4. Configure environment variables in the task definition

## License

ISC
