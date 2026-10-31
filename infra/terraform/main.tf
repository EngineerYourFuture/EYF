# EYF infrastructure-as-code — skeleton.
# Provider-agnostic scaffold. Fill in the managed-service modules for your
# chosen stack (examples: Neon/RDS Postgres, Upstash/ElastiCache Redis,
# Cloudflare DNS+WAF, R2 bucket). Secrets are GENERATED here and written to your
# secret store — never hand-copied.
terraform {
  required_version = ">= 1.6"
  required_providers {
    random = { source = "hashicorp/random", version = "~> 3.6" }
    # cloudflare = { source = "cloudflare/cloudflare", version = "~> 4" }
    # neon       = { source = "kislerdm/neon", version = "~> 0.5" }
  }
  # Use a remote backend so state is shared + locked (never local for real infra).
  # backend "s3" { bucket = "eyf-tfstate" key = "prod/terraform.tfstate" region = "ap-south-1" dynamodb_table = "eyf-tf-locks" }
}

# ── Generated application secrets (256-bit) ───────────────────────────
resource "random_password" "jwt_access"  { length = 48, special = false }
resource "random_password" "jwt_refresh" { length = 48, special = false }
resource "random_password" "admin_gate"  { length = 24, special = false }
resource "random_password" "metrics"     { length = 32, special = false }

# ── Managed Postgres (example — swap for your provider's module) ──────
# module "postgres" {
#   source        = "./modules/postgres"
#   region        = var.region
#   instance_size = var.pg_instance_size
#   pooling       = true            # exposes pooled + direct endpoints
# }

# ── Managed Redis ────────────────────────────────────────────────────
# module "redis" {
#   source = "./modules/redis"
#   region = var.region
#   tls    = true
# }

# ── Cloudflare: DNS, proxied records, WAF managed ruleset, rate limiting,
#    and a bot-fight rule in front of the origin. ──────────────────────
# module "edge" {
#   source     = "./modules/cloudflare"
#   zone       = var.domain
#   api_origin = var.api_origin
#   web_origin = var.web_origin
# }

# Push generated secrets into your platform's secret store here (example:
# vercel_project_environment_variable / railway_variable / aws_ssm_parameter).
