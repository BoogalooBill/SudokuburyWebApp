# File to define the main Terraform configuration for the project
terraform {
  required_providers {
	aws = {
	  source  = "hashicorp/aws"
	  version = "~> 5.0"
	}
  }
  backend "s3" {
	bucket = "sudokubury-terraform-state"
	key	= "terraform.tfstate"
	region = "us-east-2"
	dynamodb_table = "sudokubury-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
}