# File to define IAM roles and policies for the project

# Define the IAM role for the ECS task execution. This role allows the ECS tasks to pull images from ECR and write logs to CloudWatch.
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "sudokubury-ecs-task-execution-role"
  assume_role_policy = jsonencode({
	Version = "2012-10-17"
	Statement = [
	  {
		Effect = "Allow"
		Principal = {
		  Service = "ecs-tasks.amazonaws.com"
		}
		Action = "sts:AssumeRole"
	  }
	]
  })
}

# Define the inline policy for the ECS task execution role to allow it to pull images from ECR and write logs to CloudWatch.
resource "aws_iam_role_policy" "ecs_task_execution_role_policy" {
  name = "sudokubury-ecs-task-execution-role-policy"
  role = aws_iam_role.ecs_task_execution_role.id
  policy = jsonencode({
	Version = "2012-10-17"
	Statement = [
	  {
		Effect = "Allow"
		Action = ["secretsmanager:GetSecretValue"]
		Resource = [
			"arn:aws:secretsmanager:us-east-2:${data.aws_caller_identity.current.account_id}:secret:rds!*",			
			aws_secretsmanager_secret.jwt_key.arn,
			aws_secretsmanager_secret.connection_string.arn
		]
	  }
	]
  })
}

# Define the policy attachment for the ECS task execution role to allow it to pull images from ECR and write logs to CloudWatch.
resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Define the IAM role for the ECS tasks. This role allows the ECS tasks to access AWS resources such as Secrets Manager and EFS.
resource "aws_iam_role" "ecs_task_role" {
  name = "sudokubury-ecs-task-role"
  assume_role_policy = jsonencode({
	Version = "2012-10-17"
	Statement = [
	  {
		Effect = "Allow"
		Principal = {
		  Service = "ecs-tasks.amazonaws.com"
		}
		Action = "sts:AssumeRole"
	  }
	]
  })
}

# Define the inline policy for the ECS task role to allow it to access AWS ECR
resource "aws_iam_role_policy" "ecs_task_execution_ecr_policy" {
  name = "sudokubury-ecs-task-execution-ecr-policy"
  role = aws_iam_role.ecs_task_execution_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      }
    ]
  })
}