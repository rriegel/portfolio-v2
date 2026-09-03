variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "contact_form_sender_email" {
  description = "Email address that will send contact form submissions (must be verified in SES)"
  type        = string
}

variable "contact_form_recipient_email" {
  description = "Email address to receive contact form submissions"
  type        = string
}

variable "api_domain_name" {
  description = "Custom domain name for the contact form API"
  type        = string
}

variable "certificate_arn" {
  description = "ACM certificate ARN covering the API domain (must be in us-east-1)"
  type        = string
}
