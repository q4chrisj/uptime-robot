resource "aws_dynamodb_table" "sites" {
  name         = "${var.dynamodb_table_prefix}sites"
  billing_mode = "PROVISIONED"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  read_capacity  = var.dynamodb_read_capacity
  write_capacity = var.dynamodb_write_capacity

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name = "${var.app_name}-sites-table"
  }
}

resource "aws_dynamodb_table" "checks" {
  name         = "${var.dynamodb_table_prefix}checks"
  billing_mode = "PROVISIONED"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "siteId"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  global_secondary_index {
    name            = "siteId-timestamp-index"
    hash_key        = "siteId"
    range_key       = "timestamp"
    projection_type = "ALL"
    read_capacity   = var.dynamodb_read_capacity
    write_capacity  = var.dynamodb_write_capacity
  }

  read_capacity  = var.dynamodb_read_capacity
  write_capacity = var.dynamodb_write_capacity

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name = "${var.app_name}-checks-table"
  }
}
