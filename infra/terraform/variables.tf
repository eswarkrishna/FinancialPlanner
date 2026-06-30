variable "aws_region" {
  type        = string
  default     = "ap-south-1"
  description = "Region for the S3 origin bucket. CloudFront is global; ACM cert lives in us-east-1 regardless."
}

variable "bucket_name" {
  type        = string
  description = "Globally unique S3 bucket name (e.g. financial-planner-site-eswar)."

  validation {
    condition     = can(regex("^[a-z0-9.-]{3,63}$", var.bucket_name))
    error_message = "bucket_name must be 3-63 chars, lowercase alphanumerics, dots, or hyphens."
  }
}

variable "project_tag" {
  type        = string
  default     = "FinancialPlanner"
  description = "Project tag applied to all resources."
}

variable "domain_name" {
  type        = string
  default     = ""
  description = "Optional custom domain (e.g. planner.example.com). Leave empty to use the default *.cloudfront.net domain."
}

variable "hosted_zone_id" {
  type        = string
  default     = ""
  description = "Route 53 hosted zone ID. Required only if you also set domain_name and want Terraform to manage DNS validation + alias records."
}

variable "price_class" {
  type        = string
  default     = "PriceClass_All"
  description = "PriceClass_100 (US/EU only), PriceClass_200 (adds India/Asia/ME, excludes SA/AU/NZ), or PriceClass_All (every edge)."

  validation {
    condition     = contains(["PriceClass_100", "PriceClass_200", "PriceClass_All"], var.price_class)
    error_message = "price_class must be PriceClass_100, PriceClass_200, or PriceClass_All."
  }
}

variable "github_repo" {
  type        = string
  default     = "eswarkrishna/FinancialPlanner"
  description = "GitHub repository (owner/name) allowed to assume the deploy role via OIDC."
}

variable "github_branch_pattern" {
  type        = string
  default     = "ref:refs/heads/main"
  description = "GitHub OIDC sub claim suffix to allow. Default restricts the role to pushes on main; use 'ref:refs/heads/*' to allow any branch or 'environment:production' for environment-gated deploys."
}

variable "create_github_oidc_provider" {
  type        = bool
  default     = true
  description = "Create the GitHub Actions OIDC provider in this AWS account. Set to false if it already exists (one provider per account is allowed)."
}

variable "budget_email" {
  type        = string
  default     = ""
  description = "Email for monthly cost-budget alerts. Leave empty to skip the budget alarm."
}

variable "budget_limit_usd" {
  type        = number
  default     = 1
  description = "Monthly cost budget in USD. Alarm fires at 80% actual and 100% forecasted."
}
