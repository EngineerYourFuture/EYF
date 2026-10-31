variable "region" {
  description = "Primary cloud region (data residency: India → ap-south-1 / Mumbai)."
  type        = string
  default     = "ap-south-1"
}

variable "domain" {
  description = "Root domain managed in Cloudflare."
  type        = string
  default     = "eyf.in"
}

variable "api_origin" {
  description = "Origin hostname the api DNS record points at."
  type        = string
  default     = ""
}

variable "web_origin" {
  description = "Origin hostname the web DNS record points at."
  type        = string
  default     = ""
}

variable "pg_instance_size" {
  description = "Managed Postgres instance size / compute tier."
  type        = string
  default     = "small"
}
