# File for defining the ECS cluster and service for the project

# Define the ECS cluster for the project. The cluster will be used to run the ECS tasks for the application.
resource "aws_ecs_cluster" "sudokubury" {
  name = "sudokubury-cluster"
}

# Define the task for the database
resource "aws_ecs_task_definition" "db_task" {
  family                   = "sudokubury-db-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024"
  memory                   = "2048"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn
  container_definitions = jsonencode([
	{
	  name      = "db-container"
	  image     = "mcr.microsoft.com/mssql/server:2022-latest"
	  essential = true
	  portMappings = [
		{
		  containerPort = 1433
		  hostPort      = 1433
		  protocol      = "tcp"
		}
	  ]
	  environment = [
		{
		  name  = "ACCEPT_EULA"
		  value = "Y"
		},
		{
		  name  = "MSSQL_PID"
		  value = "Express"
		},
		{
		  name = "MSSQL_ENABLE_HADR"
		  value = "1"
		},
		{
		  name = "MSSQL_AGENT_ENABLED"
		  value = "false"
		}
	  ]
	  secrets = [
		{
		  name      = "SA_PASSWORD"
		  valueFrom = aws_secretsmanager_secret.db_password.arn
		}
	  ]
	  mountPoints = [{
	    containerPath = "/var/opt/mssql"
	    sourceVolume  = "db-data"
	  }]
	  logConfiguration = {
	    "logDriver" = "awslogs",
		"options" = {
		  "awslogs-group" = "/ecs/sudokubury-sqlserver",
		  "awslogs-region" = "us-east-2",
		  "awslogs-stream-prefix" = "ecs"
		}
	  }
	}
  ])

  volume {
	name = "db-data"
	efs_volume_configuration {
	  file_system_id = aws_efs_file_system.sudokubury.id
	  transit_encryption = "ENABLED"
	  authorization_config {
	    access_point_id = aws_efs_access_point.sudokubury.id
	 }
	}
  }
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
			image = "${aws_ecr_repository.sudokubury.repository_url}:latest"
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
				}
				{
					name = "Jwt__Audience"
					value = "SudokuburyApp"
				}
				{
					name = "Jwt__ExpireDays"
					value = "7"
				}
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

# Define the service discovery for the application
resource "aws_service_discovery_private_dns_namespace" "sudokubury" {
  name        = "sudokubury.local"
  description = "Private DNS namespace for Sudokubury application"
  vpc         = aws_vpc.main.id
}

# Define the service discovery service for the database. This will allow the application to discover the database service using DNS.
resource "aws_service_discovery_service" "sudokubury" {
  name = "sudokubury-sqlserver"
  dns_config {
	namespace_id = aws_service_discovery_private_dns_namespace.sudokubury.id
	routing_policy = "MULTIVALUE"
	dns_records {
	  type = "A"
	  ttl  = 10
	}
  }
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

# Define the ECS service for the database
resource "aws_ecs_service" "db_service" {
  name            = "sudokubury-db-service"
  cluster         = aws_ecs_cluster.sudokubury.id
  task_definition = aws_ecs_task_definition.db_task.arn
  desired_count   = 1
  launch_type     = "FARGATE"
  network_configuration {
	subnets         = aws_subnet.private[*].id
	security_groups = [aws_security_group.db_sg.id]
  }
  service_registries {
	registry_arn = aws_service_discovery_service.sudokubury.arn
  }
}