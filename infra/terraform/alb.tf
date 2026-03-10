# File to define the Application Load Balancer (ALB) for the project. The ALB will be used to route traffic to the ECS service and provide a single endpoint for the application.

# Define the creation of the ALB
resource "aws_lb" "sudokubury" {
  name               = "sudokubury-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = aws_subnet.public[*].id
  tags = {
	Name = "sudokubury-alb"
  }
}

# Define the target group for the ALB to route traffic to the ECS service. The target group will use HTTP on port 8080 and will be associated with the VPC.
resource "aws_lb_target_group" "sudokubury" {
  name     = "sudokubury-tg"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  target_type = "ip"
  health_check {
	path                = "/health"
	protocol            = "HTTP"
	interval            = 30
	timeout             = 5
	healthy_threshold   = 2
	unhealthy_threshold = 2
  }
  tags = {
	Name = "sudokubury-tg"
  }
}

# Define the listener for the ALB to listen on port 80 and forward traffic to the target group.
resource "aws_lb_listener" "sudokubury" {
  load_balancer_arn = aws_lb.sudokubury.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
	type             = "forward"
	target_group_arn = aws_lb_target_group.sudokubury.arn
  }
}
