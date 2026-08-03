provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "portfolio"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# CloudFront requires certificates in us-east-1
provider "aws" {
  alias  = "virginia"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "portfolio"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}
