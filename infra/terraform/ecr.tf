# File for defining the ECR repository for the project. Only one custom image is needed, so only one repository is created.
resource "aws_ecr_repository" "sudokubury" {
  name = "sudokubury"
  image_tag_mutability = "IMMUTABLE"
  image_scanning_configuration {
	scan_on_push = true
  }
  tags = {
	Name = "sudokubury-ecr"
  }
}