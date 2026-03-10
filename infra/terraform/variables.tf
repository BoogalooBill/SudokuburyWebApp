# File to define the variables for the Terraform infrastructure.
variable "aws_region" {
  description = "The AWS region to deploy the infrastructure in."
  type        = string
  default     = "us-east-2"
}

variable "environment" {
  description = "The environment in which to deploy the infrastructure"
  type        = string
  default     = "production"
}