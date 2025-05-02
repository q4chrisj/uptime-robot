output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.app.repository_url
}

output "dynamodb_sites_table_name" {
  description = "Name of the DynamoDB sites table"
  value       = aws_dynamodb_table.sites.name
}

output "dynamodb_checks_table_name" {
  description = "Name of the DynamoDB checks table"
  value       = aws_dynamodb_table.checks.name
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.app.name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.app.name
}

output "task_definition_family" {
  description = "Family of the task definition"
  value       = aws_ecs_task_definition.app.family
}

output "alb_dns_name" {
  description = "DNS name of the ALB"
  value       = aws_lb.app.dns_name
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = var.create_vpc ? aws_vpc.main[0].id : var.vpc_id
}

output "app_url" {
  description = "URL to access the application"
  value       = "http://${aws_lb.app.dns_name}"
}

output "ecr_push_commands" {
  description = "Commands to build and push the Docker image to ECR"
  value       = <<-EOT
    # Login to ECR
    aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com

    # Build the Docker image
    docker build -t ${aws_ecr_repository.app.repository_url}:latest .

    # Push the image to ECR
    docker push ${aws_ecr_repository.app.repository_url}:latest
  EOT
}
