# Portfolio Website

Personal portfolio website hosted on AWS with infrastructure as code.

## Architecture

- **Static Site:** S3 + CloudFront CDN
- **Contact Form:** API Gateway + Lambda + SES
- **Infrastructure:** Terraform
- **CI/CD:** GitHub Actions
- **DNS:** Cloudflare

## Project Structure

```
portfolio-v2/
├── infra/                    # Terraform infrastructure
│   ├── modules/
│   │   ├── static-site/     # S3 + CloudFront + OAC
│   │   ├── api/             # API Gateway + Lambda
│   │   └── ses/             # SES domain verification
│   ├── environments/        # Environment-specific tfvars
│   ├── main.tf             # Root module
│   ├── variables.tf        # Input variables
│   ├── outputs.tf          # Output values
│   ├── providers.tf        # AWS + Cloudflare providers
│   └── terraform.tfvars    # Variable values (gitignored)
├── app/
│   ├── site/               # Static HTML/CSS/JS
│   │   ├── index.html
│   │   ├── css/
│   │   ├── js/
│   │   └── assets/
│   └── lambda/             # Contact form handler
│       └── contact_handler.py
├── .github/workflows/      # CI/CD pipelines
└── DECISIONS.md            # Architecture decisions
```

## Prerequisites

- AWS CLI v2 configured with appropriate credentials
- Terraform >= 1.5
- Cloudflare account with API token
- Domain registered (Cloudflare or Route 53)
- GitHub repository with Actions enabled

## Setup

### 1. Configure AWS Credentials

```bash
aws configure
# Or use environment variables / IAM roles
```

### 2. Create Terraform State Bucket

```bash
aws s3api create-bucket \
  --bucket portfolio-terraform-state \
  --region us-east-1

aws s3api put-bucket-versioning \
  --bucket portfolio-terraform-state \
  --versioning-configuration Status=Enabled
```

### 3. Create DynamoDB Lock Table

```bash
aws dynamodb create-table \
  --table-name terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

### 4. Configure Terraform Variables

Copy the example tfvars file and fill in your values:

```bash
cp infra/terraform.tfvars.example infra/terraform.tfvars
# Edit terraform.tfvars with your domain, emails, etc.
```

### 5. Deploy Infrastructure

```bash
cd infra
terraform init
terraform plan
terraform apply
```

### 6. Deploy Static Site

```bash
aws s3 sync app/site/ s3://your-bucket-name --delete
```

### 7. Deploy Lambda Function

```bash
cd app/lambda
zip -r ../../lambda.zip .
aws lambda update-function-code \
  --function-name portfolio-contact-prod \
  --zip-file fileb://../../lambda.zip
```

## Development

### Local Testing

Open `app/site/index.html` in a browser to test the static site locally.

### Testing Contact Form

The contact form requires the deployed API endpoint. Update the URL in `app/site/js/contact.js` after deployment.

## CI/CD

GitHub Actions workflows automatically deploy:
- **Infrastructure:** On push to `infra/**`
- **Static Site:** On push to `app/site/**`
- **Lambda:** On push to `app/lambda/**`

## Cost Estimate

~$0.01-0.50/month for typical portfolio traffic (within AWS free tiers).

## License

See LICENSE file.
