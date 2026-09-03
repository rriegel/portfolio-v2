output "api_endpoint" {
  description = "URL of the contact form API"
  value       = aws_apigatewayv2_api.contact.api_endpoint
}

output "api_custom_domain" {
  description = "Custom domain name serving the contact form API"
  value       = aws_apigatewayv2_domain_name.contact.domain_name
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.contact.function_name
}

output "lambda_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.contact.arn
}
