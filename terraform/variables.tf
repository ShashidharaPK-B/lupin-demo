variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "eastus"
}

variable "project_name" {
  description = "Project name used in resource naming"
  type        = string
  default     = "lupin-ai"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Project   = "Lupin Procurement AI"
    ManagedBy = "Terraform"
  }
}

# PostgreSQL
variable "postgres_admin_user" {
  description = "PostgreSQL admin username"
  type        = string
  default     = "psqladmin"
}

variable "postgres_admin_pass" {
  description = "PostgreSQL admin password"
  type        = string
  sensitive   = true
}

variable "postgres_db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "shouldcost"
}

variable "postgres_sku" {
  description = "PostgreSQL Flexible Server SKU"
  type        = string
  default     = "B_Standard_B1ms"
}

# Redis
variable "redis_sku" {
  description = "Redis Cache SKU (Basic, Standard, Premium)"
  type        = string
  default     = "Basic"
}

variable "redis_capacity" {
  description = "Redis Cache capacity (0-6)"
  type        = number
  default     = 0
}

# App Service
variable "app_service_sku" {
  description = "App Service Plan SKU"
  type        = string
  default     = "B1"
}

# Azure OpenAI
variable "azure_openai_endpoint" {
  description = "Azure OpenAI endpoint URL"
  type        = string
}

variable "azure_openai_api_key" {
  description = "Azure OpenAI API key"
  type        = string
  sensitive   = true
}

variable "azure_openai_deployment_name" {
  description = "Azure OpenAI deployment name"
  type        = string
  default     = "gpt-5-chat"
}

variable "azure_openai_api_version" {
  description = "Azure OpenAI API version"
  type        = string
  default     = "2024-06-01"
}

variable "secret_key" {
  description = "Application secret key"
  type        = string
  sensitive   = true
}

variable "cors_origins" {
  description = "Allowed CORS origins"
  type        = string
  default     = "[\"http://localhost:3000\"]"
}
