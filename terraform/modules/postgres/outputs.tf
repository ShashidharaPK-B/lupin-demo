output "fqdn" {
  value = azurerm_postgresql_flexible_server.main.fqdn
}

output "connection_string" {
  value     = "postgresql+asyncpg://${var.postgres_admin_user}:${var.postgres_admin_pass}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${var.postgres_db_name}"
  sensitive = true
}
