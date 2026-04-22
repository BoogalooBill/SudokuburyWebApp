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