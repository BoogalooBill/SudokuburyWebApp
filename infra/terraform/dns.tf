# File to define the certificate validation 

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