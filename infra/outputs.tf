output "website_url" {
  description = "URL of the static website"
  value       = "https://${var.domain_name}"
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket hosting the website"
  value       = module.static_site.bucket_name
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = module.static_site.cloudfront_distribution_id
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = module.static_site.cloudfront_domain_name
}

output "api_endpoint" {
  description = "URL of the contact form API"
  value       = module.api.api_endpoint
}

output "lambda_function_name" {
  description = "Name of the contact form Lambda function"
  value       = module.api.lambda_function_name
}

output "ses_domain_identity_arn" {
  description = "ARN of the SES domain identity"
  value       = module.ses.domain_identity_arn
}

output "ses_dkim_tokens" {
  description = "DKIM tokens for DNS verification"
  value       = module.ses.dkim_tokens
}
