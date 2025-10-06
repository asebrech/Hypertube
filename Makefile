# Makefile for Hypertube Local Development
# ==========================================

# Colors for better readability (using shell escape sequences)
BLUE := \033[34m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
CYAN := \033[36m
BOLD := \033[1m
RESET := \033[0m

# Project configuration
PROJECT_NAME := Hypertube
COMPOSE_FILE := compose.yaml
BACK_ENV := ./apps/back/.env
FRONT_ENV := ./apps/front/.env
BACK_ENV_EXAMPLE := ./apps/back/.env.example
FRONT_ENV_EXAMPLE := ./apps/front/.env.example

.PHONY: help
help: ## Show this help message
	@echo ""
	@printf "$(BOLD)$(CYAN)╔════════════════════════════════════════╗$(RESET)\n"
	@printf "$(BOLD)$(CYAN)║   $(PROJECT_NAME) - Development Makefile   ║$(RESET)\n"
	@printf "$(BOLD)$(CYAN)╚════════════════════════════════════════╝$(RESET)\n"
	@echo ""
	@printf "$(BOLD)Available commands:$(RESET)\n"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(RESET) %s\n", $$1, $$2}'
	@echo ""

.PHONY: setup
setup: ## Initial project setup (run this first!)
	@printf "$(BOLD)$(GREEN)🚀 Setting up $(PROJECT_NAME)...$(RESET)\n"
	@$(MAKE) -s env-setup
	@$(MAKE) -s install
	@printf "$(BOLD)$(GREEN)✅ Setup complete!$(RESET)\n"

.PHONY: env-setup
env-setup: ## Copy environment files from examples
	@printf "$(BLUE)📝 Setting up environment files...$(RESET)\n"
	@if [ ! -f $(BACK_ENV) ]; then \
		cp $(BACK_ENV_EXAMPLE) $(BACK_ENV) && \
		printf "$(GREEN)  ✓ Created $(BACK_ENV)$(RESET)\n"; \
	else \
		printf "$(YELLOW)  ⚠ $(BACK_ENV) already exists, skipping...$(RESET)\n"; \
	fi
	@if [ ! -f $(FRONT_ENV) ]; then \
		cp $(FRONT_ENV_EXAMPLE) $(FRONT_ENV) && \
		printf "$(GREEN)  ✓ Created $(FRONT_ENV)$(RESET)\n"; \
	else \
		printf "$(YELLOW)  ⚠ $(FRONT_ENV) already exists, skipping...$(RESET)\n"; \
	fi

.PHONY: install
install: ## Install all dependencies
	@printf "$(BLUE)📦 Installing dependencies...$(RESET)\n"
	@pnpm install
	@printf "$(GREEN)  ✓ Dependencies installed$(RESET)\n"

.PHONY: db-start
db-start: ## Start the PostgreSQL database
	@printf "$(BLUE)🗄️  Starting database...$(RESET)\n"
	@docker compose up db -d
	@printf "$(GREEN)  ✓ Database is running$(RESET)\n"

.PHONY: db-stop
db-stop: ## Stop the PostgreSQL database
	@printf "$(BLUE)🗄️  Stopping database...$(RESET)\n"
	@docker compose down
	@printf "$(GREEN)  ✓ Database stopped$(RESET)\n"

.PHONY: db-logs
db-logs: ## Show database logs
	@docker compose logs -f db

.PHONY: migrate
migrate: ## Run database migrations
	@printf "$(BLUE)🔄 Running migrations...$(RESET)\n"
	@cd apps/back && pnpm migration
	@printf "$(GREEN)  ✓ Migrations complete$(RESET)\n"

.PHONY: build
build: ## Build the application for production
	@printf "$(BLUE)� Checking environment files...$(RESET)\n"
	@if [ ! -f $(BACK_ENV) ]; then \
		printf "$(RED)✗ Error: $(BACK_ENV) not found!$(RESET)\n"; \
		printf "$(YELLOW)  Run 'make env-setup' first$(RESET)\n"; \
		exit 1; \
	fi
	@if [ ! -f $(FRONT_ENV) ]; then \
		printf "$(RED)✗ Error: $(FRONT_ENV) not found!$(RESET)\n"; \
		printf "$(YELLOW)  Run 'make env-setup' first$(RESET)\n"; \
		exit 1; \
	fi
	@printf "$(GREEN)  ✓ Environment files found$(RESET)\n"
	@printf "$(BLUE)�🔨 Building application...$(RESET)\n"
	@pnpm build
	@printf "$(BLUE)📋 Copying environment files to build directories...$(RESET)\n"
	@cp apps/back/.env apps/back/build/.env 2>/dev/null || true
	@cp apps/front/.env apps/front/build/.env 2>/dev/null || true
	@printf "$(GREEN)  ✓ Build complete$(RESET)\n"

.PHONY: build-back
build-back: ## Build backend only
	@printf "$(BLUE)🔍 Checking backend environment file...$(RESET)\n"
	@if [ ! -f $(BACK_ENV) ]; then \
		printf "$(RED)✗ Error: $(BACK_ENV) not found!$(RESET)\n"; \
		printf "$(YELLOW)  Run 'make env-setup' first$(RESET)\n"; \
		exit 1; \
	fi
	@printf "$(GREEN)  ✓ Backend .env found$(RESET)\n"
	@printf "$(BLUE)🔨 Building backend...$(RESET)\n"
	@cd apps/back && pnpm build
	@printf "$(BLUE)📋 Copying backend .env to build directory...$(RESET)\n"
	@cp apps/back/.env apps/back/build/.env
	@printf "$(GREEN)  ✓ Backend build complete$(RESET)\n"

.PHONY: build-front
build-front: ## Build frontend only
	@printf "$(BLUE)🔍 Checking frontend environment file...$(RESET)\n"
	@if [ ! -f $(FRONT_ENV) ]; then \
		printf "$(RED)✗ Error: $(FRONT_ENV) not found!$(RESET)\n"; \
		printf "$(YELLOW)  Run 'make env-setup' first$(RESET)\n"; \
		exit 1; \
	fi
	@printf "$(GREEN)  ✓ Frontend .env found$(RESET)\n"
	@printf "$(BLUE)🔨 Building frontend...$(RESET)\n"
	@cd apps/front && pnpm build
	@printf "$(BLUE)📋 Copying frontend .env to build directory...$(RESET)\n"
	@cp apps/front/.env apps/front/build/.env 2>/dev/null || true
	@printf "$(GREEN)  ✓ Frontend build complete$(RESET)\n"

.PHONY: dev
dev: ## Start development servers (frontend + backend)
	@printf "$(BOLD)$(GREEN)🚀 Starting development servers...$(RESET)\n"
	@pnpm dev

.PHONY: start
start: db-start dev ## Start everything (database + dev servers)

.PHONY: prod-start
prod-start: ## Start production build (after building)
	@printf "$(BLUE)🔍 Checking build directories...$(RESET)\n"
	@if [ ! -d "apps/back/build" ]; then \
		printf "$(RED)✗ Error: Backend build not found!$(RESET)\n"; \
		printf "$(YELLOW)  Run 'make build' first$(RESET)\n"; \
		exit 1; \
	fi
	@if [ ! -f "apps/back/build/.env" ]; then \
		printf "$(RED)✗ Error: Backend .env not found in build directory!$(RESET)\n"; \
		printf "$(YELLOW)  Run 'make build' first$(RESET)\n"; \
		exit 1; \
	fi
	@printf "$(GREEN)  ✓ Production build ready$(RESET)\n"
	@printf "$(BOLD)$(GREEN)🚀 Starting production servers...$(RESET)\n"
	@printf "$(YELLOW)Starting backend...$(RESET)\n"
	@cd apps/back/build && node bin/server.js &
	@printf "$(YELLOW)Starting frontend...$(RESET)\n"
	@cd apps/front && pnpm preview

.PHONY: prod-deploy
prod-deploy: ## Full production deployment (build + run)
	@echo ""
	@printf "$(BOLD)$(CYAN)════════════════════════════════════════$(RESET)\n"
	@printf "$(BOLD)$(CYAN)   🏭 Production Deployment             $(RESET)\n"
	@printf "$(BOLD)$(CYAN)════════════════════════════════════════$(RESET)\n"
	@echo ""
	@$(MAKE) -s env-setup
	@echo ""
	@$(MAKE) -s install
	@echo ""
	@$(MAKE) -s db-start
	@echo ""
	@sleep 3
	@$(MAKE) -s migrate
	@echo ""
	@$(MAKE) -s build
	@echo ""
	@printf "$(BOLD)$(GREEN)════════════════════════════════════════$(RESET)\n"
	@printf "$(BOLD)$(GREEN)   ✅ Build Complete!                   $(RESET)\n"
	@printf "$(BOLD)$(GREEN)════════════════════════════════════════$(RESET)\n"
	@echo ""
	@printf "$(YELLOW)Starting production servers...$(RESET)\n"
	@echo ""
	@$(MAKE) -s prod-start

.PHONY: deploy
deploy: ## Complete local deployment (setup + start)
	@echo ""
	@printf "$(BOLD)$(CYAN)════════════════════════════════════════$(RESET)\n"
	@printf "$(BOLD)$(CYAN)   🎬 Deploying $(PROJECT_NAME) Locally   $(RESET)\n"
	@printf "$(BOLD)$(CYAN)════════════════════════════════════════$(RESET)\n"
	@echo ""
	@$(MAKE) -s env-setup
	@echo ""
	@$(MAKE) -s install
	@echo ""
	@$(MAKE) -s db-start
	@echo ""
	@sleep 3
	@$(MAKE) -s migrate
	@echo ""
	@printf "$(BOLD)$(GREEN)════════════════════════════════════════$(RESET)\n"
	@printf "$(BOLD)$(GREEN)   ✅ Deployment Complete!              $(RESET)\n"
	@printf "$(BOLD)$(GREEN)════════════════════════════════════════$(RESET)\n"
	@echo ""
	@printf "$(YELLOW)Starting development servers...$(RESET)\n"
	@echo ""
	@$(MAKE) -s dev

.PHONY: clean
clean: ## Clean build artifacts and dependencies
	@printf "$(RED)🧹 Cleaning project...$(RESET)\n"
	@rm -rf node_modules apps/*/node_modules packages/*/node_modules
	@rm -rf apps/back/build apps/front/.svelte-kit apps/front/build
	@printf "$(GREEN)  ✓ Cleaned$(RESET)\n"

.PHONY: clean-db
clean-db: ## Remove database volumes (WARNING: deletes all data!)
	@printf "$(RED)⚠️  WARNING: This will delete all database data!$(RESET)\n"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose down -v; \
		printf "$(GREEN)  ✓ Database volumes removed$(RESET)\n"; \
	else \
		printf "$(YELLOW)  Cancelled$(RESET)\n"; \
	fi

.PHONY: reset
reset: clean clean-db setup ## Full reset (clean everything and setup again)
	@printf "$(BOLD)$(GREEN)✅ Project reset complete!$(RESET)\n"

.PHONY: status
status: ## Show project status
	@printf "$(BOLD)$(CYAN)📊 Project Status$(RESET)\n"
	@echo ""
	@printf "$(YELLOW)Database:$(RESET)\n"
	@docker compose ps
	@echo ""
	@printf "$(YELLOW)Node modules:$(RESET)\n"
	@if [ -d "node_modules" ]; then \
		printf "$(GREEN)  ✓ Installed$(RESET)\n"; \
	else \
		printf "$(RED)  ✗ Not installed$(RESET)\n"; \
	fi
	@echo ""
	@printf "$(YELLOW)Environment files:$(RESET)\n"
	@if [ -f $(BACK_ENV) ]; then \
		printf "$(GREEN)  ✓ Backend .env exists$(RESET)\n"; \
	else \
		printf "$(RED)  ✗ Backend .env missing$(RESET)\n"; \
	fi
	@if [ -f $(FRONT_ENV) ]; then \
		printf "$(GREEN)  ✓ Frontend .env exists$(RESET)\n"; \
	else \
		printf "$(RED)  ✗ Frontend .env missing$(RESET)\n"; \
	fi

.DEFAULT_GOAL := help
