.PHONY: help build up down logs migrate makemigration shell-backend shell-db \
        test-backend test-frontend lint install-backend install-frontend \
        dev-backend dev-frontend clean

# Default target
help: ## Show available commands
	@echo "AI Should Cost Engine - Available Commands"
	@echo "==========================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-25s\033[0m %s\n", $$1, $$2}'

build: ## Build all Docker images
	docker compose build

up: ## Start all services in detached mode
	docker compose up -d

down: ## Stop all services
	docker compose down

logs: ## Follow logs for all services
	docker compose logs -f

migrate: ## Run Alembic migrations (upgrade head)
	docker compose exec backend alembic upgrade head

makemigration: ## Create new Alembic migration (usage: make makemigration name=migration_name)
	@if [ -z "$(name)" ]; then \
		echo "Error: provide migration name with: make makemigration name=<name>"; \
		exit 1; \
	fi
	docker compose exec backend alembic revision --autogenerate -m "$(name)"

shell-backend: ## Open shell in backend container
	docker compose exec backend bash

shell-db: ## Open psql shell in postgres container
	docker compose exec postgres psql -U $${POSTGRES_USER} -d $${POSTGRES_DB}

test-backend: ## Run backend tests with coverage
	docker compose exec backend pytest tests/ -v --cov=app --cov-report=term-missing

test-frontend: ## Run frontend tests
	docker compose exec frontend npm test

lint: ## Run linters (ruff + eslint)
	docker compose exec backend ruff check app/
	docker compose exec frontend npm run lint

install-backend: ## Install backend dependencies with uv
	cd backend && uv sync

install-frontend: ## Install frontend dependencies with npm
	cd frontend && npm install

dev-backend: ## Run backend locally with hot reload
	cd backend && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

dev-frontend: ## Run frontend dev server locally
	cd frontend && npm run dev

clean: ## Remove containers, volumes, and images
	docker compose down -v --rmi local
	docker system prune -f
