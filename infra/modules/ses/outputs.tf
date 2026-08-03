output "domain_identity_arn" {
  description = "ARN of the SES domain identity"
  value       = aws_ses_domain_identity.main.arn
}

output "dkim_tokens" {
  description = "DKIM tokens for DNS verification"
  value       = aws_ses_domain_dkim.main.dkim_tokens
}

output "mail_from_domain" {
  description = "MAIL FROM domain"
  value       = aws_ses_domain_mail_from.main.mail_from_domain
}
