# File for defining the ECS cluster and service for the project

# Define the ECS cluster for the project. The cluster will be used to run the ECS tasks for the application.
resource "aws_ecs_cluster" "sudokubury" {
  name = "sudokubury-cluster"
}

# Define the task for the application
resource "aws_ecs_task_definition" "sudokubury_task" {
	family = "sudokubury-app-task"
	network_mode = "awsvpc"
	requires_compatibilities = ["FARGATE"]
	cpu = "512"
	memory = "1024"
	execution_role_arn = aws_iam_role.ecs_task_execution_role.arn
	task_role_arn = aws_iam_role.ecs_task_role.arn
	container_definitions = jsonencode([
		{
			name = "sudokubury-app-container"
			image = "669308277837.dkr.ecr.us-east-2.amazonaws.com/sudokubury:latest"
			essential = true
			portMappings = [
				{
					containerPort = 8080
					hostPort = 8080
					protocol = "tcp"
				}
			]
			environment = [
				{
					name = "Jwt__Issuer"
					value = "SudokuburyApp"
				},
				{
					name = "Jwt__Audience"
					value = "SudokuburyApp"
				},
				{
					name = "Jwt__ExpireDays"
					value = "7"
				},
				{
					name = "AllowedOrigins__0"
					value = "http://${aws_lb.sudokubury.dns_name}"
				},
				{
					name = "ASPNETCORE_ENVIRONMENT",
					value = "Production"
				}
			]
			secrets = [
				{
					name = "Jwt__Key"
					valueFrom = aws_secretsmanager_secret.jwt_key.arn
				},
				{
					name = "ConnectionStrings__DefaultConnection"
					valueFrom = aws_secretsmanager_secret.connection_string.arn
				}
			]
			logConfiguration = {
				logDriver = "awslogs",
				options = {
					"awslogs-group" = "/ecs/sudokubury-app",
					"awslogs-region" = "us-east-2",
					"awslogs-stream-prefix" = "ecs"
				}
			}
		}
	])
}

# Define the ECS service for the application
resource "aws_ecs_service" "sudokubury_app" {
  name            = "sudokubury-app-service"
  cluster         = aws_ecs_cluster.sudokubury.id
  task_definition = aws_ecs_task_definition.sudokubury_task.arn
  desired_count   = 1
  launch_type     = "FARGATE"
  network_configuration {
	subnets         = aws_subnet.private[*].id
	security_groups = [aws_security_group.app_sg.id]
  }
  load_balancer {
    target_group_arn = aws_lb_target_group.sudokubury.arn
	container_name   = "sudokubury-app-container"
	container_port   = 8080
  }
}

resource "aws_cloudwatch_log_group" "sudokubury_app" {
  name              = "/ecs/sudokubury-app"
  retention_in_days = 7
  tags = {
    Name = "sudokubury-app-logs"
  }
}