# This file defines all elements of networking for the web application, including VPC, subnets, and security groups.

# Define the VPC
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = {
	Name = "sudokubury-vpc"
  }
}

# Define the public subnets for the web application. Two subnets are created for high availability across two availability zones.
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = ["10.0.1.0/24", "10.0.2.0/24"][count.index]
  availability_zone       = ["us-east-2a", "us-east-2b"][count.index]
  map_public_ip_on_launch = true
  tags = {
	Name = "sudokubury-public-subnet-${count.index}"
  }
}


# Define the private subnets for the database. Two subnets are created for high availability across two availability zones.
resource "aws_subnet" "private" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = ["10.0.3.0/24", "10.0.4.0/24"][count.index]
  availability_zone       = ["us-east-2a", "us-east-2b"][count.index]

  tags = {
	Name = "sudokubury-private-subnet-${count.index}"
  }
}

# Define the gateway for the VPC to allow internet access for the public subnets.
resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id
  tags = {
	Name = "sudokubury-igw"
  }
}

# Route table for the public subnets to allow internet access.
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
	cidr_block = "0.0.0.0/0"
	gateway_id = aws_internet_gateway.gw.id
  }

  tags = {
	Name = "sudokubury-public-rt"
  }
}

# Route table association for the public subnets.
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Security group for the application load balancer
resource "aws_security_group" "alb_sg" {
  name        = "sudokubury-alb-sg"
  description = "Security group for the application load balancer"
  vpc_id      = aws_vpc.main.id
  ingress {
	protocol    = "tcp"
	from_port   = 80
	to_port     = 80
	cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
	from_port   = 0
	to_port     = 0
	protocol    = "-1"
	cidr_blocks = ["0.0.0.0/0"]
  }
  tags = {
	Name = "sudokubury-alb-sg"
  }
}

# Security group for the app
resource "aws_security_group" "app_sg" {
  name        = "sudokubury-app-sg"
  description = "Security group for the application servers"
  vpc_id      = aws_vpc.main.id
  ingress {
	protocol    = "tcp"
	from_port   = 8080
	to_port     = 8080
	security_groups = [aws_security_group.alb_sg.id]
  }
  egress {
	protocol    = "-1"
	from_port   = 0
	to_port     = 0
	cidr_blocks = ["0.0.0.0/0"]
  }
  tags = {
	Name = "sudokubury-app-sg"
  }
}

# Security group for the database
resource "aws_security_group" "db_sg" {
  name        = "sudokubury-db-sg"
  description = "Security group for the database servers"
  vpc_id      = aws_vpc.main.id
  ingress {
	protocol    = "tcp"
	from_port   = 1433
	to_port     = 1433
	security_groups = [aws_security_group.app_sg.id]
  }
  egress {
	protocol    = "-1"
	from_port   = 0
	to_port     = 0
	cidr_blocks = ["0.0.0.0/0"]
  }
  tags = {
	Name = "sudokubury-db-sg"
  }
}