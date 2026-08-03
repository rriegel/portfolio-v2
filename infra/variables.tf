variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "portfolio"
}

variable "domain_name" {
  description = "Primary domain name (e.g., yourdomain.com)"
  type        = string
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID for the domain"
  type        = string
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token with DNS edit permissions"
  type        = string
  sensitive   = true
}

variable "contact_form_sender_email" {
  description = "Email address that will send contact form submissions (must be verified in SES)"
  type        = string
}

variable "contact_form_recipient_email" {
  description = "Email address to receive contact form submissions"
  type        = string
}
