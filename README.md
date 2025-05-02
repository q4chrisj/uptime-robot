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
├── .deploy/                # Terraform configuration
│   ├── dynamodb.tf         # DynamoDB tables
│   ├── ecs.tf              # ECS and container config
│   ├── iam.tf              # IAM roles and policies
│   ├── main.tf             # Main Terraform configuration
│   ├── outputs.tf          # Outputs from Terraform
│   ├── variables.tf        # Variables for Terraform
│   ├── vpc.tf              # VPC configuration
│   └── terraform.tfvars.example # Example variables file
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
4. For AWS authentication, ensure the service has access to AWS credentials through one of these methods:
   - IAM role attached to the instance/container (recommended)
   - Environment variables (`AWS_` prefixed)
   - AWS shared credentials file (~/.aws/credentials)

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

- **ECS/Fargate**: For hosting the containerized service
- **DynamoDB**: For storing sites and check results
- **ECR**: For storing Docker images
- **CloudWatch**: For monitoring and logging
- **Application Load Balancer**: For routing traffic to the service
- **IAM**: For authentication using role-based access

### IAM Role Authentication

This service uses IAM role-based authentication instead of access keys:

- When running on EC2, assign an IAM role to the instance with appropriate DynamoDB permissions
- When running on ECS/Fargate, configure a task execution role with DynamoDB permissions
- When running on Lambda, the Lambda execution role should have the necessary permissions

No AWS access keys need to be configured in the application itself, improving security.

## Testing

Run the test suite:

```
npm test
```

## Deployment

### Manual Deployment

#### To AWS EC2

1. Set up an EC2 instance with Node.js
2. Clone the repository and install dependencies
3. Configure environment variables in a `.env` file or through instance environment
4. Use a process manager like PM2 to keep the service running:
   ```
   npm install -g pm2
   pm2 start dist/index.js --name "uptime-robot"
   ```

#### To AWS ECS/Fargate using Docker

1. Build a Docker image for the service
   ```
   docker build -t uptime-robot .
   ```
2. Push the image to Amazon ECR (after authenticating):
   ```
   aws ecr get-login-password | docker login --username AWS --password-stdin <aws_account_id>.dkr.ecr.<region>.amazonaws.com
   docker tag uptime-robot:latest <aws_account_id>.dkr.ecr.<region>.amazonaws.com/uptime-robot:latest
   docker push <aws_account_id>.dkr.ecr.<region>.amazonaws.com/uptime-robot:latest
   ```
3. Create an ECS task definition and service
4. Configure environment variables in the task definition

### Automated Deployment with Terraform

The project includes Terraform configuration in the `.deploy` directory to automate the deployment to AWS. This creates all necessary infrastructure including VPC, ECS cluster, DynamoDB tables, and IAM roles.

#### Prerequisites for Terraform Deployment

- Terraform installed (version 1.2.0 or higher)
- AWS CLI configured with appropriate permissions
- S3 bucket for Terraform state (optional, but recommended)

#### Terraform Deployment Steps

1. Navigate to the `.deploy` directory:
   ```
   cd .deploy
   ```

2. Create a `terraform.tfvars` file from the example:
   ```
   cp terraform.tfvars.example terraform.tfvars
   ```

3. Edit the `terraform.tfvars` file to customize your deployment.

4. If using S3 backend for state, update the `backend` configuration in `main.tf` with your S3 bucket information.

5. Initialize Terraform:
   ```
   terraform init
   ```

6. Plan your changes:
   ```
   terraform plan
   ```

7. Apply the changes:
   ```
   terraform apply
   ```

8. After successful application, Terraform will output the ALB endpoint and other important information.

#### Terraform Resources Created

The Terraform configuration creates the following resources:

- VPC with public and private subnets (optional, can use existing VPC)
- ECS Fargate cluster
- Task definition with appropriate IAM roles
- ECR repository for Docker images
- DynamoDB tables for storing site configurations and check results
- Application Load Balancer for routing traffic
- CloudWatch Log Group for monitoring

#### Customizing the Deployment

The main variables that can be customized include:

- `aws_region` - AWS region to deploy to
- `environment` - Environment name (dev, staging, prod)
- `create_vpc` - Whether to create a new VPC or use existing
- `vpc_id` and `subnet_ids` - If using existing VPC
- `container_cpu` and `container_memory` - Container resource allocation
- `desired_count` - Number of tasks to run
- `check_interval_minutes` - How often to check websites
- `timeout_ms` - Timeout for website checks

## License

ISC
