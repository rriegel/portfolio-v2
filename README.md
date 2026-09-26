# Portfolio Site

Serverless static portfolio website deployed on AWS with Terraform infrastructure as code.

**Live site:** https://ryanriegel.dev

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

### Running the Site Locally

The site is plain HTML/CSS/JS in `app/site/` — serve it with any static file server (a server is needed so the contact form's relative paths and fetch calls behave like production):

```bash
# From the repo root — pick whichever you have:
python3 -m http.server 8000 --directory app/site
# or: npx serve app/site
```

Then open http://localhost:8000.

**Note on the contact form:** it posts to the production API (`https://api.ryanriegel.dev/contact`) which is hardcoded in `app/site/script.js`, so submissions from the local preview send real email through the live SES endpoint. CORS on the API only allows the production origins, so browsers will block the request from `localhost` — the form will appear broken locally. Everything else (layout, styles, nav) works. To test the form locally, temporarily point `API_ENDPOINT` at the API Gateway URL from `terraform output api_endpoint` (CORS will still block it from localhost; use curl instead — see below).

### Testing the Contact Form API

```bash
# Validation errors (expect 400 with an errors list)
curl -X POST "$(cd infra && terraform output -raw api_endpoint)/contact" \
  -H "Content-Type: application/json" -d '{}'

# Or through the custom domain (expect 200 and a real email)
curl -X POST "https://api.ryanriegel.dev/contact" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"you@example.com","message":"Hello from curl"}'
```

### Lambda Unit Tests

```bash
cd app/lambda
python3 test_contact_handler.py

# Build Lambda package
./build.sh
```

### Deployment

1. Push to `main` branch triggers GitHub Actions
2. Workflow builds Lambda, stamps content-hashed asset URLs into the HTML, deploys the site to S3 (immutable assets cached 1 year; HTML always revalidated), and invalidates the CloudFront cache
3. Site live at your domain

**Cache busting:** deploy.yml rewrites the `styles.css` / `timeline.js` / `script.js` references to `?v=<content-hash>` and syncs them as immutable assets (`max-age=31536000`). A changed asset changes its URL, so returning visitors never serve stale CSS/JS from their browser cache after a deploy — and unchanged assets keep their cache entries between deploys. The CloudFront distribution includes the query string in its cache key (`infra/modules/static-site/main.tf`), so versioned URLs also miss the edge cache. HTML files are synced `no-cache` and revalidated on every visit. Keep the two S3 sync groups disjoint: JS/CSS assets belong to the long-cache group via hashed URLs; only `index.html`/`404.html` go in the no-cache group.

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
