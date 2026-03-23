variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "project_name" { type = string }
variable "environment" { type = string }
variable "subnet_id" { type = string }
variable "redis_sku" { type = string }
variable "redis_capacity" { type = number }
variable "tags" { type = map(string) }
