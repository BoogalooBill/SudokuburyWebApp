# File to define the outputs after running the Terraform infrastructure.
output "alb_dns_name" {
  description = "The DNS name of the Application Load Balancer"
  value       = aws_lb.sudokubury.dns_name
}