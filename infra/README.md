# Infrastructure — AWS deploy

Cost-optimised hosting for the FinancialPlanner SPA. Static `dist/` is served from a private S3 bucket through CloudFront with TLS via ACM. No always-on compute.

## What gets created

| Resource | Purpose |
|----------|---------|
| `aws_s3_bucket.site` | Private origin bucket (versioned, SSE-S3, public access blocked). |
| `aws_cloudfront_origin_access_control.site` | OAC so only this distribution can read S3. |
| `aws_cloudfront_distribution.site` | CDN with HTTP/2+3, gzip/brotli, SPA fallback (403/404 → `/index.html` 200), security headers. |
| `aws_acm_certificate.site` *(optional)* | TLS cert in `us-east-1`, only when `domain_name` is set. |
| `aws_route53_record.*` *(optional)* | Validation + `A`/`AAAA` aliases when `hosted_zone_id` is set. |
| `aws_iam_openid_connect_provider.github` | GitHub Actions OIDC (skip with `create_github_oidc_provider = false` if it already exists). |
| `aws_iam_role.github_deploy` | Deploy role scoped to one bucket + one distribution. |
| `aws_budgets_budget.monthly` *(optional)* | $1/month alert at 80 % actual + 100 % forecasted. |

Estimated steady-state cost for a personal site under the free tier: **~$0–1/month**.

## Why this shape

- **Private S3 + OAC** keeps bucket origin closed; CloudFront is the only reader.
- **Managed cache policy + compression** maximises hit ratio without writing custom JS.
- **Custom error responses** handle SPA routing without paying for Lambda@Edge or CloudFront Functions.
- **OIDC role** removes long-lived AWS keys from CI; only `main` of the configured repo can assume it.

## Apply locally

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# edit bucket_name (must be globally unique) and any optional domain values

terraform init
terraform plan
terraform apply
```

After apply, copy these outputs into GitHub repo secrets:

| Output | GitHub secret |
|--------|---------------|
| `s3_bucket_name` | `S3_BUCKET` |
| `cloudfront_distribution_id` | `CLOUDFRONT_DISTRIBUTION_ID` |
| `github_actions_role_arn` | `AWS_DEPLOY_ROLE_ARN` |

The `cloudfront_domain_name` and `site_url` outputs are public URLs; no secret needed.

## CI/CD

`.github/workflows/deploy.yml` runs on every push to `main`:

1. `npm ci` → `npm run lint` → `npm run test` → `npm run build`.
2. Assumes the deploy role via OIDC.
3. Syncs `dist/assets/*` with `Cache-Control: public, max-age=31536000, immutable` (Vite hashes filenames so this is safe forever).
4. Syncs other top-level files with a 5 minute cache.
5. Uploads `index.html` with `no-cache, must-revalidate` so users always pull the latest pointer.
6. Invalidates `/` and `/index.html` only — hashed assets never need invalidation, which keeps invalidations free (1000/month) for typical usage.

## Custom domain (optional)

1. Set `domain_name = "planner.example.com"` and `hosted_zone_id` in `terraform.tfvars`.
2. `terraform apply`. ACM validates via DNS automatically; CloudFront picks up the cert.
3. The `site_url` output flips to `https://planner.example.com`.

If your DNS lives outside Route 53, set only `domain_name`, leave `hosted_zone_id` empty, and create the ACM validation `CNAME` and the final `CNAME` to `cloudfront_domain_name` in your registrar manually.

## Tearing it down

```bash
terraform destroy
```

S3 versioning is enabled, so `terraform destroy` will fail if the bucket still has objects. Either:

- Empty the bucket from the AWS console first, or
- Add `force_destroy = true` to `aws_s3_bucket.site` temporarily, re-apply, then destroy.

## Remote state (recommended for shared work)

The default config uses local state. For team use, add a `backend` block, e.g.:

```hcl
terraform {
  backend "s3" {
    bucket         = "your-tfstate-bucket"
    key            = "financial-planner/static-site.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "your-tfstate-locks"
    encrypt        = true
  }
}
```
