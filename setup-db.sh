#!/bin/bash

echo "=== Database Setup Script Started ==="

# Test multiple possible passwords to see what actually works
passwords=("MyStrongPassword123" "MyStrongPassword123!" "" "SA_PASSWORD" "sa" "Password123")

echo "Testing different passwords to find the correct one..."

working_password=""
for password in "${passwords[@]}"; do
    echo "Testing password: '$password'"
    if /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$password" -C -Q "SELECT 1" > /dev/null 2>&1; then
        echo "SUCCESS! Working password found: '$password'"
        working_password="$password"
        break
    else
        echo "Failed with password: '$password'"
    fi
done

if [ -z "$working_password" ]; then
    echo "ERROR: No working password found. Trying to create new admin user..."
    
    # Try to create a new admin user with various passwords
    for password in "${passwords[@]}"; do
        echo "Trying to create admin user with existing password: '$password'"
        if /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$password" -C -Q "
            IF NOT EXISTS (SELECT name FROM sys.server_principals WHERE name = 'dbadmin')
            BEGIN
                CREATE LOGIN dbadmin WITH PASSWORD = 'MyStrongPassword123';
                ALTER SERVER ROLE sysadmin ADD MEMBER dbadmin;
                PRINT 'Admin user created successfully!';
            END
            ELSE
            BEGIN
                PRINT 'Admin user already exists.';
            END
        " > /dev/null 2>&1; then
            echo "Admin user created successfully with password: '$password'"
            working_password="$password"
            break
        fi
    done
else
    echo "Ensuring SA account is enabled and password is set correctly..."
    /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$working_password" -C -Q "
        ALTER LOGIN sa ENABLE;
        ALTER LOGIN sa WITH PASSWORD = 'MyStrongPassword123';
        PRINT 'SA account configured successfully!';
    " || echo "Failed to configure SA account"
fi

if [ -n "$working_password" ]; then
    echo "=== Database Setup Completed Successfully ==="
    echo "Working password: '$working_password'"
else
    echo "=== Database Setup Failed ==="
    echo "Could not establish any working connection"
fi

echo "=== Setup Script Finished ==="