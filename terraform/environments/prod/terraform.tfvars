environment  = "prod"
location     = "eastus"
project_name = "lupin-ai"

# PostgreSQL - Prod (general purpose)
postgres_sku        = "GP_Standard_D2s_v3"
postgres_db_name    = "shouldcost"
postgres_admin_user = "psqladmin"

# Redis - Prod (standard with replication)
redis_sku      = "Standard"
redis_capacity = 1

# App Service - Prod
app_service_sku = "P1v3"

# Azure OpenAI
azure_openai_deployment_name = "gpt-5-chat"
azure_openai_api_version     = "2024-06-01"
