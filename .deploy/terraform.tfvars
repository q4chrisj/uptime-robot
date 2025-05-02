# AWS Region
aws_region = "us-east-1"

# Environment
environment = "dev"

# Application Name
app_name = "uptime-robot"

# DynamoDB Settings
dynamodb_table_prefix = "uptime_robot_"
dynamodb_read_capacity = 5
dynamodb_write_capacity = 5

# VPC Settings
create_vpc = false                # We're using an existing VPC
vpc_id = "vpc-xxxxxxxx"           # Replace with your actual VPC ID

# Subnet Configuration
subnet_ids = [                   # General subnet IDs if not specifying public/private separately
  "subnet-xxxxxxxx",              # Replace with your subnet IDs
  "subnet-yyyyyyyy"               # At least 2 subnets in different AZs
]

# Optionally, you can specify different subnets for ALB and ECS tasks
# public_subnet_ids = ["subnet-public1", "subnet-public2"]  # Uncomment and set for ALB
# private_subnet_ids = ["subnet-private1", "subnet-private2"]  # Uncomment and set for ECS tasks

# ECS Settings
container_cpu = 256
container_memory = 512
desired_count = 1
container_port = 3000
ecr_repository_name = "uptime-robot"

# Application Settings
check_interval_minutes = 5
timeout_ms = 5000

# CloudWatch Logs
logs_retention_in_days = 30
