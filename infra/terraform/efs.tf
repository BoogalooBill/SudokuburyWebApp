# File to define the EFS file system and mount targets for the project

# Define the EFS file system for the project.
resource "aws_efs_file_system" "sudokubury" {
  creation_token = "sudokubury-efs"
  tags = {
	Name = "sudokubury-efs"
  }
}

# Define the mount targets for the EFS file system.
resource "aws_efs_mount_target" "sudokubury" {
  count          = 2
  file_system_id = aws_efs_file_system.sudokubury.id
  subnet_id      = aws_subnet.private[count.index].id
  security_groups = [aws_security_group.db_sg.id]
}

# Define the access point for the EFS file system to allow the SQL Server container to access the file system with the correct permissions
resource "aws_efs_access_point" "sudokubury" {
  file_system_id = aws_efs_file_system.sudokubury.id
  posix_user {
	uid = 0
	gid = 0
  }
  root_directory {
	path = "/sqlserver-data"
	creation_info {
	  owner_uid = 0
	  owner_gid = 0
	  permissions = "755"
	}
  }
}

