# File to define the metadata for the secrets that will be used in the project
resource "aws_secretsmanager_secret" "jwt_key" {
  name = "sudokubury/jwt_key"
  description = "Secret key for signing JWT tokens"
}

resource "aws_secretsmanager_secret" "connection_string" {
	name = "sudokubury/connection_string"
	description = "Database connection string"
}
