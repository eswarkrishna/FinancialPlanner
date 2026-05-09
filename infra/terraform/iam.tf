data "aws_caller_identity" "current" {}

# GitHub Actions OIDC provider. Only one is allowed per AWS account; flip the
# variable to false if a provider already exists from another stack.
resource "aws_iam_openid_connect_provider" "github" {
  count = var.create_github_oidc_provider ? 1 : 0

  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]

  # AWS validates the GitHub OIDC certificate directly, but Terraform still
  # requires a thumbprint list. These are the well-known GitHub Actions values.
  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1",
    "1c58a3a8518e8759bf075b76b750d4f2df264fcd",
  ]
}

locals {
  # `one(...)` returns null when the OIDC provider has count = 0, so we
  # fall back to the well-known ARN of an existing provider in this account.
  managed_oidc_provider_arn  = one(aws_iam_openid_connect_provider.github[*].arn)
  external_oidc_provider_arn = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com"
  github_oidc_provider_arn   = coalesce(local.managed_oidc_provider_arn, local.external_oidc_provider_arn)
}

data "aws_iam_policy_document" "github_actions_assume" {
  statement {
    sid     = "GitHubOIDCAssume"
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [local.github_oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repo}:${var.github_branch_pattern}"]
    }
  }
}

resource "aws_iam_role" "github_deploy" {
  name               = "${var.bucket_name}-github-deploy"
  description        = "GitHub Actions role for deploying ${var.project_tag} to S3 + CloudFront."
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume.json
}

data "aws_iam_policy_document" "github_deploy" {
  statement {
    sid    = "S3BucketLevel"
    effect = "Allow"
    actions = [
      "s3:ListBucket",
      "s3:GetBucketLocation",
    ]
    resources = [aws_s3_bucket.site.arn]
  }

  statement {
    sid    = "S3ObjectLevel"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:AbortMultipartUpload",
    ]
    resources = ["${aws_s3_bucket.site.arn}/*"]
  }

  statement {
    sid    = "CloudFrontInvalidate"
    effect = "Allow"
    actions = [
      "cloudfront:CreateInvalidation",
      "cloudfront:GetInvalidation",
      "cloudfront:GetDistribution",
      "cloudfront:ListInvalidations",
    ]
    resources = [aws_cloudfront_distribution.site.arn]
  }
}

resource "aws_iam_role_policy" "github_deploy" {
  name   = "${var.bucket_name}-deploy"
  role   = aws_iam_role.github_deploy.id
  policy = data.aws_iam_policy_document.github_deploy.json
}
