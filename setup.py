#!/usr/bin/env python3
"""
🏠 Rental House Management System - Setup Script

This script helps set up the RHMS development environment.
"""

import os
import sys
import subprocess
import mysql.connector
from pathlib import Path

def run_command(command, cwd=None):
    """Run a shell command and return the result."""
    try:
        result = subprocess.run(command, shell=True, check=True, cwd=cwd, 
                              capture_output=True, text=True)
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr

def check_python_version():
    """Check if Python version is compatible."""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8 or higher is required")
        return False
    print(f"✅ Python {version.major}.{version.minor}.{version.micro} detected")
    return True

def check_mysql_connection():
    """Check if MySQL is running and accessible."""
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password=''
        )
        conn.close()
        print("✅ MySQL connection successful")
        return True
    except mysql.connector.Error as e:
        print(f"❌ MySQL connection failed: {e}")
        return False

def setup_database():
    """Set up the database schema."""
    schema_file = Path('backend/schema.sql')
    if not schema_file.exists():
        print("❌ Database schema file not found")
        return False
    
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password=''
        )
        cursor = conn.cursor()
        
        # Create database if it doesn't exist
        cursor.execute("CREATE DATABASE IF NOT EXISTS rhms")
        cursor.execute("USE rhms")
        
        # Read and execute schema
        with open(schema_file, 'r') as f:
            schema_sql = f.read()
        
        # Split SQL statements and execute
        statements = [s.strip() for s in schema_sql.split(';') if s.strip()]
        for statement in statements:
            if statement:
                cursor.execute(statement)
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print("✅ Database setup completed")
        return True
    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        return False

def install_python_dependencies():
    """Install Python dependencies."""
    requirements_file = Path('requirements.txt')
    if not requirements_file.exists():
        print("❌ requirements.txt not found")
        return False
    
    success, output = run_command(f"{sys.executable} -m pip install -r requirements.txt")
    if success:
        print("✅ Python dependencies installed")
        return True
    else:
        print(f"❌ Failed to install Python dependencies: {output}")
        return False

def install_node_dependencies():
    """Install Node.js dependencies."""
    frontend_dir = Path('frontend')
    if not frontend_dir.exists():
        print("❌ Frontend directory not found")
        return False
    
    success, output = run_command("npm install", cwd=frontend_dir)
    if success:
        print("✅ Node.js dependencies installed")
        return True
    else:
        print(f"❌ Failed to install Node.js dependencies: {output}")
        return False

def create_env_file():
    """Create .env file from template."""
    env_example = Path('.env.example')
    env_file = Path('.env')
    
    if env_file.exists():
        print("✅ .env file already exists")
        return True
    
    if env_example.exists():
        env_file.write_text(env_example.read_text())
        print("✅ .env file created from template")
        return True
    else:
        print("⚠️  .env.example not found, creating basic .env")
        basic_env = """# RHMS Environment Configuration
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DB=rhms
FLASK_SECRET_KEY=rhms_secret_key_change_in_production
FLASK_ENV=development
"""
        env_file.write_text(basic_env)
        print("✅ Basic .env file created")
        return True

def main():
    """Main setup function."""
    print("🏠 RHMS Setup Script")
    print("=" * 50)
    
    # Check prerequisites
    if not check_python_version():
        return False
    
    if not check_mysql_connection():
        print("Please ensure MySQL is running and accessible")
        return False
    
    # Create environment file
    create_env_file()
    
    # Install dependencies
    print("\n📦 Installing dependencies...")
    if not install_python_dependencies():
        return False
    
    if not install_node_dependencies():
        return False
    
    # Setup database
    print("\n🗄️  Setting up database...")
    if not setup_database():
        return False
    
    print("\n🎉 Setup completed successfully!")
    print("\n🚀 Next steps:")
    print("1. Start backend: python backend/app.py")
    print("2. Start frontend: cd frontend && npm run dev")
    print("3. Open http://localhost:5173 in your browser")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
