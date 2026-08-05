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

# SES Domain Verification Records
resource "cloudflare_record" "ses_verification" {
  zone_id = var.cloudflare_zone_id
  name    = "_amazonses"
  content = module.ses.domain_identity_arn
  type    = "TXT"
  ttl     = 1
}

resource "cloudflare_record" "ses_dkim" {
  count   = 3
  zone_id = var.cloudflare_zone_id
  name    = "${module.ses.dkim_tokens[count.index]}._domainkey"
  content = "${module.ses.dkim_tokens[count.index]}.dkim.amazonses.com"
  type    = "CNAME"
  ttl     = 1
}

resource "cloudflare_record" "ses_mail_from" {
  zone_id = var.cloudflare_zone_id
  name    = "mail"
  content = "feedback-smtp.us-east-1.amazonses.com"
  type    = "CNAME"
  ttl     = 1
}

resource "cloudflare_record" "ses_mail_from_spf" {
  zone_id = var.cloudflare_zone_id
  name    = "mail"
  content = "v=spf1 include:amazonses.com ~all"
  type    = "TXT"
  ttl     = 1
}
