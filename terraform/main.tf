terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.100"
    }
  }

  backend "azurerm" {
    resource_group_name  = "tfstate-rg"
    storage_account_name = "lupintfstate"
    container_name       = "tfstate"
    key                  = "lupin-procurement-ai.tfstate"
  }
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}

resource "azurerm_resource_group" "main" {
  name     = "rg-${var.project_name}-${var.environment}"
  location = var.location
  tags     = var.tags
}

module "network" {
  source              = "./modules/network"
  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  project_name        = var.project_name
  environment         = var.environment
  tags                = var.tags
}

module "postgres" {
  source              = "./modules/postgres"
  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  project_name        = var.project_name
  environment         = var.environment
  subnet_id           = module.network.db_subnet_id
  postgres_admin_user = var.postgres_admin_user
  postgres_admin_pass = var.postgres_admin_pass
  postgres_db_name    = var.postgres_db_name
  postgres_sku        = var.postgres_sku
  tags                = var.tags
}

module "redis" {
  source              = "./modules/redis"
  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  project_name        = var.project_name
  environment         = var.environment
  subnet_id           = module.network.redis_subnet_id
  redis_sku           = var.redis_sku
  redis_capacity      = var.redis_capacity
  tags                = var.tags
}

module "app_service" {
  source              = "./modules/app_service"
  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  project_name        = var.project_name
  environment         = var.environment
  subnet_id           = module.network.app_subnet_id
  app_service_sku     = var.app_service_sku

  database_url = module.postgres.connection_string
  redis_url    = module.redis.connection_string

  azure_openai_endpoint        = var.azure_openai_endpoint
  azure_openai_api_key         = var.azure_openai_api_key
  azure_openai_deployment_name = var.azure_openai_deployment_name
  azure_openai_api_version     = var.azure_openai_api_version
  secret_key                   = var.secret_key
  cors_origins                 = var.cors_origins

  tags = var.tags
}
