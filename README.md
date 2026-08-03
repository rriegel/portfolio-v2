# Portfolio Site

Serverless static portfolio website deployed on AWS with Terraform infrastructure as code.

## Architecture

- **Static Site**: S3 + CloudFront CDN
- **Contact Form**: API Gateway + Lambda + SES
- **Infrastructure**: Terraform
- **CI/CD**: GitHub Actions
- **DNS**: Cloudflare

## Project Structure

```
.
├── app/
│   ├── lambda/          # Contact form handler
│   │   ├── contact_handler.py
│   │   ├── test_contact_handler.py
│   │   └── build.sh
│   └── site/            # Static HTML/CSS/JS
│       ├── index.html
│       ├── styles.css
│       └── script.js
├── infra/               # Terraform configuration
│   ├── modules/
│   │   ├── static-site/ # S3 + CloudFront
│   │   ├── api/         # API Gateway + Lambda
│   │   └── ses/         # SES email
│   ├── main.tf
│   ├── variables.tf
│   └── versions.tf
└── .github/workflows/   # CI/CD pipeline
    └── deploy.yml
```

## Development

### Local Testing

```bash
# Test Lambda function
cd app/lambda
python3 test_contact_handler.py

# Build Lambda package
./build.sh
```

### Deployment

1. Push to `main` branch triggers GitHub Actions
2. Workflow builds Lambda, deploys site to S3, invalidates CloudFront cache
3. Site live at your domain

## Infrastructure Setup

```bash
cd infra
terraform init
terraform plan
terraform apply
```

## Configuration

Create `infra/terraform.tfvars`:

```hcl
domain_name                  = "yourdomain.com"
cloudflare_zone_id           = "your-zone-id"
cloudflare_api_token         = "your-api-token"
contact_form_sender_email    = "contact@yourdomain.com"
contact_form_recipient_email = "you@yourdomain.com"
```

## License

MIT
