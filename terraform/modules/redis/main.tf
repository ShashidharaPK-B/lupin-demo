resource "azurerm_redis_cache" "main" {
  name                = "redis-${var.project_name}-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  capacity            = var.redis_capacity
  family              = var.redis_sku == "Premium" ? "P" : "C"
  sku_name            = var.redis_sku
  enable_non_ssl_port = false
  minimum_tls_version = "1.2"
  subnet_id           = var.redis_sku == "Premium" ? var.subnet_id : null
  tags                = var.tags

  redis_configuration {
    maxmemory_policy = "allkeys-lru"
  }
}
