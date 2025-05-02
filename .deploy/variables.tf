variable "aws_region" {
  description = "The AWS region to deploy resources to"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "dynamodb_table_prefix" {
  description = "Prefix for DynamoDB table names"
  type        = string
  default     = "uptime_robot_"
}

variable "dynamodb_read_capacity" {
  description = "Read capacity units for DynamoDB tables"
  type        = number
  default     = 5
}

variable "dynamodb_write_capacity" {
  description = "Write capacity units for DynamoDB tables"
  type        = number
  default     = 5
}

variable "app_name" {
  description = "Name of the application"
  type        = string
  default     = "uptime-robot"
}

variable "vpc_id" {
  description = "VPC ID where resources will be deployed"
  type        = string
  default     = null
}

variable "subnet_ids" {
  description = "List of subnet IDs where resources will be deployed"
  type        = list(string)
  default     = []
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for the ALB (if different from subnet_ids)"
  type        = list(string)
  default     = []
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for ECS tasks (if different from subnet_ids)"
  type        = list(string)
  default     = []
}

variable "create_vpc" {
  description = "Whether to create a new VPC"
  type        = bool
  default     = true
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "check_interval_minutes" {
  description = "Interval in minutes for checking website status"
  type        = number
  default     = 5
}

variable "timeout_ms" {
  description = "Timeout in milliseconds for website checks"
  type        = number
  default     = 5000
}

variable "container_cpu" {
  description = "CPU units for the ECS task (1024 = 1 vCPU)"
  type        = number
  default     = 256
}

variable "container_memory" {
  description = "Memory for the ECS task in MiB"
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "Number of instances of the task to run"
  type        = number
  default     = 1
}

variable "container_port" {
  description = "Port the container listens on"
  type        = number
  default     = 3000
}

variable "ecr_repository_name" {
  description = "Name of the ECR repository"
  type        = string
  default     = "uptime-robot"
}

variable "ecs_task_execution_role_name" {
  description = "ECS task execution role name"
  type        = string
  default     = "uptime-robot-execution-role"
}

variable "ecs_task_role_name" {
  description = "ECS task role name"
  type        = string
  default     = "uptime-robot-task-role"
}

variable "logs_retention_in_days" {
  description = "CloudWatch logs retention period in days"
  type        = number
  default     = 30
}
