# Stage 1: Build Environment
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

# Restore Node.js dependencies
WORKDIR /app/sudokuburywebapp.client
RUN npm ci

# Go back to app root and copy all source code
WORKDIR /app
COPY . .

# Build the client app explicitly
WORKDIR /app/sudokuburywebapp.client
RUN npm run build

# Build and publish the server
WORKDIR /app/SudokuburyWebApp.Server
RUN dotnet publish -c Release -o /app/publish --no-restore

# Stage 2: Runtime Environment
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build-env /app/publish .

# Expose the port that the app will run on
EXPOSE 8080

# Set the entry point
ENTRYPOINT ["dotnet", "SudokuburyWebApp.Server.dll"]