# VS Code Setup for RHMS

## 🚀 Quick Start

### Method 1: Use Startup Scripts
```bash
# Double-click this file
start-servers.bat
```

### Method 2: VS Code Tasks
1. Open VS Code
2. Press `Ctrl+Shift+P`
3. Type "Tasks: Run Task"
4. Select "Start All Servers"

### Method 3: Manual Start
```bash
# Terminal 1 - Backend
cd backend && python app.py

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

## 🌐 Access Points
- **Tenant Portal**: http://localhost:5176
- **Admin Dashboard**: http://localhost:5000/dashboard
- **Login**: admin / 1234

## 🎯 VS Code Debug Config
Press `F5` → Select:
- "Launch Frontend (Tenant Portal)"
- "Launch Admin Dashboard (Flask)"
- "Launch Full RHMS System"
