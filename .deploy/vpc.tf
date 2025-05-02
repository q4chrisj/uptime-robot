locals {
  az_count = 2
  azs      = slice(data.aws_availability_zones.available.names, 0, local.az_count)
}

# Data sources for existing VPC resources
data "aws_vpc" "existing" {
  count = var.create_vpc ? 0 : 1
  id    = var.vpc_id
}

data "aws_subnets" "existing" {
  count = var.create_vpc ? 0 : 1
  filter {
    name   = "vpc-id"
    values = [var.vpc_id]
  }
}

data "aws_subnet" "existing" {
  for_each = var.create_vpc ? {} : toset(var.subnet_ids)
  id       = each.key
}

data "aws_availability_zones" "available" {}

resource "aws_vpc" "main" {
  count                = var.create_vpc ? 1 : 0
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "${var.app_name}-vpc"
  }
}

# Public subnets
resource "aws_subnet" "public" {
  count                   = var.create_vpc ? local.az_count : 0
  vpc_id                  = aws_vpc.main[0].id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.app_name}-public-subnet-${count.index + 1}"
  }
}

# Private subnets for ECS tasks
resource "aws_subnet" "private" {
  count             = var.create_vpc ? local.az_count : 0
  vpc_id            = aws_vpc.main[0].id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + local.az_count)
  availability_zone = local.azs[count.index]

  tags = {
    Name = "${var.app_name}-private-subnet-${count.index + 1}"
  }
}

resource "aws_internet_gateway" "main" {
  count  = var.create_vpc ? 1 : 0
  vpc_id = aws_vpc.main[0].id

  tags = {
    Name = "${var.app_name}-igw"
  }
}

# NAT Gateway for private subnets
resource "aws_eip" "nat" {
  count  = var.create_vpc ? 1 : 0
  domain = "vpc"

  tags = {
    Name = "${var.app_name}-nat-eip"
  }
}

resource "aws_nat_gateway" "main" {
  count         = var.create_vpc ? 1 : 0
  allocation_id = aws_eip.nat[0].id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name = "${var.app_name}-nat"
  }

  depends_on = [aws_internet_gateway.main]
}

# Public route table
resource "aws_route_table" "public" {
  count  = var.create_vpc ? 1 : 0
  vpc_id = aws_vpc.main[0].id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main[0].id
  }

  tags = {
    Name = "${var.app_name}-public-route-table"
  }
}

# Private route table
resource "aws_route_table" "private" {
  count  = var.create_vpc ? 1 : 0
  vpc_id = aws_vpc.main[0].id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[0].id
  }

  tags = {
    Name = "${var.app_name}-private-route-table"
  }
}

# Route table associations
resource "aws_route_table_association" "public" {
  count          = var.create_vpc ? local.az_count : 0
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public[0].id
}

resource "aws_route_table_association" "private" {
  count          = var.create_vpc ? local.az_count : 0
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[0].id
}

# Security group for the ECS tasks
resource "aws_security_group" "ecs_tasks" {
  name        = "${var.app_name}-ecs-tasks-sg"
  description = "Security group for ${var.app_name} ECS tasks"
  vpc_id      = var.create_vpc ? aws_vpc.main[0].id : var.vpc_id

  ingress {
    from_port   = var.container_port
    to_port     = var.container_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Application port"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "${var.app_name}-ecs-tasks-sg"
  }
}

# ALB Security Group
resource "aws_security_group" "alb" {
  name        = "${var.app_name}-alb-sg"
  description = "Security group for ${var.app_name} ALB"
  vpc_id      = var.create_vpc ? aws_vpc.main[0].id : var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP access"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "${var.app_name}-alb-sg"
  }
}
