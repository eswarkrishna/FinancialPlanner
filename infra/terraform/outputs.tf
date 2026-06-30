output "s3_bucket_name" {
  value       = aws_s3_bucket.site.bucket
  description = "Origin S3 bucket name. Use as S3_BUCKET in GitHub Actions secrets."
}

output "cloudfront_distribution_id" {
  value       = aws_cloudfront_distribution.site.id
  description = "CloudFront distribution ID. Use as CLOUDFRONT_DISTRIBUTION_ID in GitHub Actions secrets."
}

output "cloudfront_domain_name" {
  value       = aws_cloudfront_distribution.site.domain_name
  description = "Default *.cloudfront.net domain. Reachable immediately after first deploy."
}

output "github_actions_role_arn" {
  value       = aws_iam_role.github_deploy.arn
  description = "Role ARN for GitHub Actions OIDC. Use as AWS_DEPLOY_ROLE_ARN in GitHub Actions secrets."
}

output "site_url" {
  value       = var.domain_name != "" ? "https://${var.domain_name}" : "https://${aws_cloudfront_distribution.site.domain_name}"
  description = "Public URL once a deploy has uploaded index.html."
}
