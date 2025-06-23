using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SudokuburyWebApp.Server.Data;
using SudokuburyWebApp.Server.Services;
using System.Security.Cryptography;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Configure logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
if (builder.Environment.IsProduction())
{
    builder.Logging.AddJsonConsole();
}

// Database configuration - handle both development and production
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// Check if we're using LocalDB (not supported in Docker/Linux) and provide fallback
if (!string.IsNullOrEmpty(connectionString) && connectionString.Contains("localdb"))
{
    // For containerized environments, use environment variable or throw error
    connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");

    if (string.IsNullOrEmpty(connectionString))
    {
        throw new InvalidOperationException(
            "LocalDB is not supported in containerized environments. " +
            "Please provide a proper SQL Server connection string via environment variable 'ConnectionStrings__DefaultConnection'");
    }
}

// Always use SQL Server
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.")));

// Adding Identity with production-ready settings
builder.Services.AddIdentity<IdentityUser, IdentityRole>(options =>
{
    // Password requirements
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 8; // Increased for production

    options.User.RequireUniqueEmail = true;

    // Account lockout settings for production security
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// JWT Authentication with environment-specific settings
var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "SudokuburyApp";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "SudokuburyApp";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.FromMinutes(5) // Reduce clock skew for production
    };
});

// Adding other services
builder.Services.AddControllers();
builder.Services.AddScoped<SudokuService>();
builder.Services.AddScoped<JwtService>();

// Health checks
builder.Services.AddHealthChecks()
    .AddCheck("self", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy());

// OpenAPI/Swagger - only in development
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddOpenApi();
}

// CORS Configuration - environment specific
builder.Services.AddCors(options =>
{
    if (builder.Environment.IsDevelopment())
    {
        options.AddPolicy("AllowReactApp", policy =>
        {
            policy.WithOrigins("https://localhost:50534", "http://localhost:3000", "http://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        });
    }
    else
    {
        // Production CORS - configure based on your actual domain
        var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
            ?? new[] { "https://sudokubury.app", "https://www.sudokubury.app" };

        options.AddPolicy("AllowReactApp", policy =>
        {
            policy.WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        });
    }
});

// Security headers
builder.Services.AddHsts(options =>
{
    options.Preload = true;
    options.IncludeSubDomains = true;
    options.MaxAge = TimeSpan.FromDays(365);
});

var app = builder.Build();

// Database initialization
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();

    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();

        // For production, use migrations. For development/testing, ensure database is created
        if (app.Environment.IsProduction())
        {
            logger.LogInformation("Applying database migrations...");
            await context.Database.MigrateAsync();
        }
        else
        {
            logger.LogInformation("Ensuring database is created...");
            await context.Database.EnsureCreatedAsync();
        }

        logger.LogInformation("Database initialization completed successfully.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while initializing the database.");

        // In production, you might want to exit the application if database init fails
        if (app.Environment.IsProduction())
        {
            throw;
        }
    }
}

// Serve static files
app.UseDefaultFiles();
app.MapStaticAssets();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts(); // Enable HSTS in production
}

// Security headers middleware
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");

    if (!app.Environment.IsDevelopment())
    {
        context.Response.Headers.Append("Content-Security-Policy",
            "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;");
    }

    await next();
});

// Only redirect to HTTPS in production (Docker containers typically handle this at the load balancer level)
if (app.Environment.IsProduction())
{
    app.UseHttpsRedirection();
}

app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();

// Health check endpoints
app.MapHealthChecks("/health");
app.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready")
});

app.MapControllers();
app.MapFallbackToFile("/index.html");

app.Run();