# File to define the outputs after running the Terraform infrastructure.
output "alb_dns_name" {
  description = "The DNS name of the Application Load Balancer"
  value       = aws_lb.sudokubury.dns_name
}

output "rds_endpoint" {
  description = "The endpoint of the RDS instance"
  value       = aws_db_instance.sudokubury.endpoint
}

output "route53_nameservers" {
  description = "The nameservers to configure in Cloudflare"
  value       = aws_route53_zone.sudokubury.name_servers
}