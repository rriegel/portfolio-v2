variable "domain_name" {
  description = "Domain name to verify in SES"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}
variable "recipient_email" {
  description = "Email address that receives contact form submissions (verified as an SES identity so sandbox accounts can deliver to it)"
  type        = string
}
