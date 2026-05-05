# File to define the Route 53 hosted zone and record for the project

# Define the Route 53 hosted zone for the domain
resource "aws_route53_zone" "sudokubury" {
  name = "sudokubury.dev"
  tags = {
	Name = "sudokubury-hosted-zone"
  }
}

# Request an ACM certificate for the domain
resource "aws_acm_certificate" "sudokubury" {
  domain_name       = "sudokubury.dev"
  validation_method = "DNS"
  lifecycle {
	create_before_destroy = true
  }
  tags = {
	Name = "sudokubury-cert"
  }
}

# Create the DNS validation record in Route 53
resource "aws_route53_record" "cert_validation" {
	for_each = {
		for dvo in aws_acm_certificate.sudokubury.domain_validation_options : dvo.domain_name => {
			name = dvo.resource_record_name
			type = dvo.resource_record_type
			record = dvo.resource_record_value
		}
	}
	zone_id = aws_route53_zone.sudokubury.zone_id
	name    = each.value.name
	type    = each.value.type
	ttl     = 60
	records = [each.value.record]
}

# Wait for the certificate to be validated
resource "aws_acm_certificate_validation" "sudokubury" {
	certificate_arn         = aws_acm_certificate.sudokubury.arn
	validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# Create the alias record pointing to the ALB
resource "aws_route53_record" "sudokubury" {
  zone_id = aws_route53_zone.sudokubury.zone_id
  name    = "sudokubury.dev"
  type    = "A"
  alias {
	name = aws_lb.sudokubury.dns_name
	zone_id  = aws_lb.sudokubury.zone_id
	evaluate_target_health = true
  }
}