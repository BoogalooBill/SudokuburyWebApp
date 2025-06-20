# Stage 1: Build Environment
# Use the official .NET SDK image that includes everything we need to build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build-env

# Install Node.js 20.x (LTS version)
RUN apt-get update && apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install -y nodejs

# Verify installations
RUN dotnet --version
RUN node --version
RUN npm --version

# Set working directory
WORKDIR /app

# Copy solution file
COPY *.sln ./

# Copy project files for dependency restoration
COPY SudokuburyWebApp.Server/*.csproj ./SudokuburyWebApp.Server/
COPY sudokuburywebapp.client/*.esproj ./sudokuburywebapp.client/
COPY sudokuburywebapp.client/package*.json ./sudokuburywebapp.client/

# Restore .NET dependencies
RUN dotnet restore

# Restore Node.js dependencies (INCLUDING dev dependencies for build)
WORKDIR /app/sudokuburywebapp.client
RUN npm ci  # Remove --only=production

# Go back to app root
WORKDIR /app

# Copy all source code
COPY . .

# Build and publish the application
WORKDIR /app/SudokuburyWebApp.Server

# First, let's try building to see any errors
RUN dotnet build -c Release --no-restore --verbosity detailed

# Then publish with verbose output
RUN dotnet publish -c Release -o /app/publish --no-restore

# Stage 2: Runtime Environment
# Use the smaller ASP.NET Core runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime

# Set working directory
WORKDIR /app

# Copy the published application from the build stage
COPY --from=build-env /app/publish .

# Expose the port that the app will run on
EXPOSE 8080

# Set the entry point
ENTRYPOINT ["dotnet", "SudokuburyWebApp.Server.dll"]