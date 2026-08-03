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
