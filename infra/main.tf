module "static_site" {
  source = "./modules/static-site"

  bucket_name     = "${var.project_name}-${var.environment}"
  environment   = var.environment
  domain_name   = var.domain_name
  certificate_arn = aws_acm_certificate.main.arn
}

module "api" {
  source = "./modules/api"

  project_name                   = var.project_name
  environment                    = var.environment
  contact_form_sender_email      = var.contact_form_sender_email
  contact_form_recipient_email   = var.contact_form_recipient_email
}

module "ses" {
  source = "./modules/ses"

  project_name = var.project_name
  environment  = var.environment
  domain_name  = var.domain_name
}
