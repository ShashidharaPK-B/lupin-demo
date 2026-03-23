output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "app_service_url" {
  value = module.app_service.app_url
}

output "postgres_fqdn" {
  value = module.postgres.fqdn
}

output "redis_hostname" {
  value = module.redis.hostname
}
