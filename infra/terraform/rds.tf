resource "aws_db_subnet_group" "sudokubury" {
	name = "sudokubury-db-subnet-group"
	subnet_ids = aws_subnet.private[*].id
	tags = {
		Name = "sudokubury-db-subnet-group"
	}
}

resource "aws_db_instance" "sudokubury" {
	identifier = "sudokubury-db"
	engine = "postgres"
	engine_version = "16"
	instance_class = "db.t3.micro"
	db_name = "SudokuGameAppDb"
	username = "postgres"
	manage_master_user_password = true
	db_subnet_group_name = aws_db_subnet_group.sudokubury.name
	vpc_security_group_ids = [aws_security_group.db_sg.id]
	allocated_storage = 20
	skip_final_snapshot = true
	deletion_protection = false
	tags = {
		Name = "sudokubury-db"
	}
}

# Retrieve the RDS master user password from Secrets Manager
data "aws_secretsmanager_secret_version" "rds_password" {
	secret_id = aws_db_instance.sudokubury.master_user_secret[0].secret_arn
	depends_on = [aws_db_instance.sudokubury]
}

# Create a secret in Secrets Manager to store the connection string for the application
locals {
	rds_credentials = jsondecode(data.aws_secretsmanager_secret_version.rds_password.secret_string)
	rds_password = local.rds_credentials["password"]
	connection_string = "Host=${aws_db_instance.sudokubury.address};Database=SudokuGameAppDb;Username=postgres;Password=${local.rds_password};"
}