resource "aws_acm_certificate" "site" {
  count    = var.domain_name != "" ? 1 : 0
  provider = aws.us_east_1

  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# Splat (`site[*]`) returns an empty list when the cert has count = 0,
# which keeps for_each safe regardless of whether a domain is configured.
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in flatten([for c in aws_acm_certificate.site : c.domain_validation_options]) :
    dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    } if var.hosted_zone_id != ""
  }

  zone_id         = var.hosted_zone_id
  name            = each.value.name
  type            = each.value.type
  ttl             = 60
  records         = [each.value.record]
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "site" {
  count    = var.domain_name != "" ? 1 : 0
  provider = aws.us_east_1

  certificate_arn         = aws_acm_certificate.site[0].arn
  validation_record_fqdns = var.hosted_zone_id != "" ? [for r in aws_route53_record.cert_validation : r.fqdn] : null
}
