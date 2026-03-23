variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "project_name" { type = string }
variable "environment" { type = string }
variable "subnet_id" { type = string }
variable "postgres_admin_user" { type = string }
variable "postgres_admin_pass" { type = string; sensitive = true }
variable "postgres_db_name" { type = string }
variable "postgres_sku" { type = string }
variable "tags" { type = map(string) }
