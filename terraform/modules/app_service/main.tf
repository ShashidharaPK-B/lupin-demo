resource "azurerm_service_plan" "main" {
  name                = "asp-${var.project_name}-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  os_type             = "Linux"
  sku_name            = var.app_service_sku
  tags                = var.tags
}

resource "azurerm_linux_web_app" "backend" {
  name                      = "app-${var.project_name}-api-${var.environment}"
  location                  = var.location
  resource_group_name       = var.resource_group_name
  service_plan_id           = azurerm_service_plan.main.id
  virtual_network_subnet_id = var.subnet_id
  https_only                = true
  tags                      = var.tags

  site_config {
    always_on = true

    application_stack {
      docker_image_name = "lupin-backend:latest"
    }
  }

  app_settings = {
    DATABASE_URL                 = var.database_url
    REDIS_URL                    = var.redis_url
    AZURE_OPENAI_ENDPOINT        = var.azure_openai_endpoint
    AZURE_OPENAI_API_KEY         = var.azure_openai_api_key
    AZURE_OPENAI_DEPLOYMENT_NAME = var.azure_openai_deployment_name
    AZURE_OPENAI_API_VERSION     = var.azure_openai_api_version
    SECRET_KEY                   = var.secret_key
    CORS_ORIGINS                 = var.cors_origins
    UPLOAD_DIR                   = "/app/uploads"
    WEBSITES_PORT                = "8000"
  }
}

resource "azurerm_linux_web_app" "frontend" {
  name                = "app-${var.project_name}-web-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  service_plan_id     = azurerm_service_plan.main.id
  https_only          = true
  tags                = var.tags

  site_config {
    always_on = true

    application_stack {
      docker_image_name = "lupin-frontend:latest"
    }
  }

  app_settings = {
    VITE_API_URL  = "https://${azurerm_linux_web_app.backend.default_hostname}"
    VITE_APP_NAME = "AI Should Cost Engine"
    WEBSITES_PORT = "80"
  }
}
