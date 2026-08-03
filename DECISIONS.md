# Architecture Decisions

This document captures key architectural decisions for the portfolio website.

## Decision 1: Static Site over React SPA

**Context:** Previous portfolio used React. Needed to decide whether to continue with React or switch to static HTML/CSS/JS.

**Decision:** Use plain HTML/CSS/JS for the static site.

**Rationale:**
- Portfolio is primarily static content (resume, projects, contact form)
- No complex client-side interactivity needed
- Simpler build process, faster page loads, smaller bundle size
- Easier to maintain and deploy
- Still showcases technical skills through infrastructure (Terraform, CI/CD, AWS)

**Trade-offs:**
- Less "modern" feel than React
- No component reusability (but site is small enough this doesn't matter)
- Manual HTML updates vs. component-based updates

## Decision 2: Serverless Contact Form

**Context:** Need contact form functionality without running a persistent server.

**Decision:** Use AWS Lambda + API Gateway + SES for contact form processing.

**Rationale:**
- Scales to zero cost when not in use
- No server maintenance
- Demonstrates AWS serverless skills
- Simple enough for the use case (receive form POST, send email)

**Alternatives considered:**
- EC2 instance with backend API (overkill, ongoing cost)
- Third-party form service (Formspree, etc.) (less control, monthly cost)
- Client-side mailto link (poor UX, requires email client)

## Decision 3: Terraform for Infrastructure

**Context:** Need to provision AWS resources reproducibly.

**Decision:** Use Terraform with modular structure.

**Rationale:**
- Industry standard for infrastructure as code
- Demonstrates IaC skills (relevant to job)
- Modular approach allows reusability
- State management via S3 backend
- Works well with CI/CD pipelines

## Decision 4: GitHub Actions for CI/CD

**Context:** Need automated deployment pipeline.

**Decision:** Use GitHub Actions for both infrastructure and application deployment.

**Rationale:**
- Native GitHub integration
- Free for public repos
- YAML-based configuration is straightforward
- Can trigger on push to specific paths
- Supports Terraform and AWS CLI out of the box

## Decision 5: Cloudflare for DNS

**Context:** Domain already registered with Cloudflare.

**Decision:** Use Cloudflare DNS to point to AWS CloudFront.

**Rationale:**
- Domain already on Cloudflare
- Free DNS service
- Simple CNAME records to CloudFront

## Decision 6: S3 + CloudFront for Static Hosting

**Context:** Need to host static HTML/CSS/JS files.

**Decision:** Use S3 for storage + CloudFront for CDN distribution.

**Rationale:**
- Cost-effective (pennies per month)
- Global CDN for fast page loads
- Automatic HTTPS via CloudFront
- Scales automatically
- Standard AWS pattern for static sites

## Decision 7: Python for Lambda Function

**Context:** Need to choose runtime for contact form handler.

**Decision:** Use Python 3.12 for the Lambda function.

**Rationale:**
- Familiar language (part of tech stack)
- Built-in boto3 for AWS SDK
- Simple syntax for form validation and email sending
- Cold start times acceptable for this use case

## Decision 8: Monorepo Structure

**Context:** Need to organize infrastructure code and application code.

**Decision:** Use monorepo with separate directories for infra and app.

**Rationale:**
- Single repository for entire project
- Easy to see all code in one place
- Simplifies CI/CD (one repo to clone)
- Terraform modules reference app code directly

## Decision 9: Environment Separation

**Context:** Need to manage different deployment environments.

**Decision:** Start with single prod environment, use tfvars files for future dev/prod separation.

**Rationale:**
- YAGNI — don't need dev environment on day one
- Can add later when needed
- tfvars files make it easy to introduce

## Decision 10: No Authentication

**Context:** Portfolio is public-facing.

**Decision:** No authentication or access controls.

**Rationale:**
- Portfolio is meant to be publicly accessible
- No sensitive data or admin functionality
- Simplifies architecture

## Phase 1: Application Code

### Lambda Function (contact_handler.py)
- **Language**: Python 3.12 (Lambda-optimized, fast cold starts)
- **Validation**: Server-side validation for name, email, message
- **CORS**: Handled in Lambda (not just API Gateway) for flexibility
- **Error Handling**: Specific error messages, graceful failures
- **Email Format**: HTML + plain text for maximum compatibility
- **Security**: No sensitive data in logs, input sanitization

### Static Site
- **Structure**: Single-page HTML with sections (About, Projects, Contact)
- **Styling**: Vanilla CSS, responsive design, no frameworks
- **JavaScript**: Minimal, fetch API for form submission
- **API Endpoint**: Placeholder replaced during deployment via sed
- **Caching**: Aggressive cache for assets, no-cache for HTML/JS

### CI/CD Pipeline (GitHub Actions)
- **Trigger**: Push to main branch
- **Authentication**: OIDC (no long-lived AWS credentials)
- **Deployment Order**: Lambda → Site → CloudFront invalidation
- **Cache Strategy**: Static assets cached 1 year, HTML/JS no-cache
- **Rollback**: Manual (revert commit and redeploy)

### Testing Strategy
- Lambda unit tests for validation logic
- Manual E2E testing after deployment
- No automated E2E (overkill for portfolio site)
