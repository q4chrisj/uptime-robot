# ECS Task Execution Role
resource "aws_iam_role" "ecs_task_execution_role" {
  name = var.ecs_task_execution_role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.app_name}-ecs-execution-role"
  }
}

# Attach the AWS managed policy for ECS task execution
resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECS Task Role - for the application to access AWS services
resource "aws_iam_role" "ecs_task_role" {
  name = var.ecs_task_role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.app_name}-ecs-task-role"
  }
}

# DynamoDB access policy for the application
resource "aws_iam_policy" "dynamodb_access" {
  name        = "${var.app_name}-dynamodb-access"
  description = "Policy for DynamoDB access for ${var.app_name}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:DeleteItem",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:UpdateItem"
        ]
        Effect = "Allow"
        Resource = [
          aws_dynamodb_table.sites.arn,
          aws_dynamodb_table.checks.arn,
          "${aws_dynamodb_table.checks.arn}/index/*"
        ]
      }
    ]
  })
}

# Attach DynamoDB access policy to task role
resource "aws_iam_role_policy_attachment" "task_dynamodb_access" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.dynamodb_access.arn
}

# CloudWatch logs policy for the application
resource "aws_iam_policy" "task_logging" {
  name        = "${var.app_name}-task-logging"
  description = "Policy for CloudWatch Logs access for ${var.app_name}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:CreateLogGroup"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

# Attach CloudWatch logs policy to task role
resource "aws_iam_role_policy_attachment" "task_logging" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.task_logging.arn
}

# Attach CloudWatch logs policy to execution role
resource "aws_iam_role_policy_attachment" "execution_logging" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = aws_iam_policy.task_logging.arn
}
