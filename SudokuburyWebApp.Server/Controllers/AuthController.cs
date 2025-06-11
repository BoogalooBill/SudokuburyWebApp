using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using SudokuburyWebApp.Server.DTO;
using SudokuburyWebApp.Server.Services;
using System.Security.Claims;

namespace SudokuburyWebApp.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : Controller
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly SignInManager<IdentityUser> _signInManager;
        private readonly JwtService _jwtService;

        public AuthController (UserManager<IdentityUser> userManager, SignInManager<IdentityUser> signInManager, JwtService jwtService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _jwtService = jwtService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] AuthRegisterRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new AuthResponse
                {
                    Success = false,
                    Message = "Invalid registration data"
                });
            }

            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
            {
                return BadRequest(new AuthResponse
                {
                    Success = false,
                    Message = "User account with this email address already exists"
                });
            }

            var user = new IdentityUser
            {
                UserName = request.Email,
                Email = request.Email
            };
            
            var result = await _userManager.CreateAsync(user, request.Password);

            if (!result.Succeeded)
            {
                return BadRequest(new AuthResponse
                {
                    Success = false,
                    Message = string.Join(", ", result.Errors.Select(e => e.Description))
                });
            }

            var token = _jwtService.GenerateToken(user);
            var expiration = _jwtService.GetTokenExpiration();

            return Ok(new AuthResponse
            {
                Success = true,
                Message = "Registration successful",
                Token = token,
                TokenExpiration = expiration,
                User = new UserInfo
                {
                    Id = user.Id,
                    Email = user.Email
                }
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] AuthLoginRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new AuthResponse
                {
                    Success = false,
                    Message = "Invalid login data"
                });
            }

            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                return Unauthorized(new AuthResponse
                {
                    Success = false,
                    Message = "Invalid email or password"
                });
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
            if (!result.Succeeded)
            {
                return Unauthorized(new AuthResponse
                {
                    Success = false,
                    Message = "Invalid email or password"
                });
            }

            var token = _jwtService.GenerateToken(user);
            var expiration = _jwtService.GetTokenExpiration();

            return Ok(new AuthResponse
            {
                Success = true,
                Message = "Login successful",
                Token = token,
                TokenExpiration = expiration,
                User = new UserInfo
                {
                    Id = user.Id,
                    Email = user.Email
                }
            });
        }

        [HttpGet("profile")]
        [Authorize]
        public async Task<IActionResult> GetProfile()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
            {
                return Unauthorized(new AuthResponse
                {
                    Success = false,
                    Message = "User not found"
                });
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return Unauthorized(new AuthResponse
                {
                    Success = false,
                    Message = "User not found"
                });
            }

            return Ok(new AuthResponse
            {
                Success = true,
                Message = "Profile retrieved successfully",
                User = new UserInfo
                {
                    Id = user.Id,
                    Email = user.Email!
                }
            });
        }
    }
}
