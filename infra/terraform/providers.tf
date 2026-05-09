provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = var.project_tag
      ManagedBy = "Terraform"
      Component = "static-site"
    }
  }
}

# CloudFront and ACM for CloudFront live in us-east-1.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project   = var.project_tag
      ManagedBy = "Terraform"
      Component = "static-site"
    }
  }
}
