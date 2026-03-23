variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "project_name" { type = string }
variable "environment" { type = string }
variable "subnet_id" { type = string }
variable "app_service_sku" { type = string }
variable "database_url" { type = string; sensitive = true }
variable "redis_url" { type = string; sensitive = true }
variable "azure_openai_endpoint" { type = string }
variable "azure_openai_api_key" { type = string; sensitive = true }
variable "azure_openai_deployment_name" { type = string }
variable "azure_openai_api_version" { type = string }
variable "secret_key" { type = string; sensitive = true }
variable "cors_origins" { type = string }
variable "tags" { type = map(string) }
