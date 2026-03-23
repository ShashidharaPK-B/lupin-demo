output "hostname" {
  value = azurerm_redis_cache.main.hostname
}

output "connection_string" {
  value     = "rediss://:${azurerm_redis_cache.main.primary_access_key}@${azurerm_redis_cache.main.hostname}:${azurerm_redis_cache.main.ssl_port}/0"
  sensitive = true
}

output "primary_access_key" {
  value     = azurerm_redis_cache.main.primary_access_key
  sensitive = true
}
