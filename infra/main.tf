module "static_site" {
  source = "./modules/static-site"

  bucket_name     = "${var.project_name}-${var.environment}-rrigel"
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

# Cloudflare DNS records for CloudFront
resource "cloudflare_record" "site_root" {
  zone_id = var.cloudflare_zone_id
  name    = "ryanriegel.dev"
  content = module.static_site.cloudfront_domain_name
  type    = "CNAME"
  proxied = false  # DNS only - CloudFront handles SSL/TLS
  ttl     = 1
}

resource "cloudflare_record" "site_www" {
  zone_id = var.cloudflare_zone_id
  name    = "www"
  content = module.static_site.cloudfront_domain_name
  type    = "CNAME"
  proxied = false  # DNS only - CloudFront handles SSL/TLS
  ttl     = 1
}

resource "cloudflare_record" "site_api" {
  zone_id = var.cloudflare_zone_id
  name    = "api"
  content = replace(module.api.api_endpoint, "https://", "")
  type    = "CNAME"
  proxied = false
  ttl     = 1
}
