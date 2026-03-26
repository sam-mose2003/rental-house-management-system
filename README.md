# 🏠 Rental House Management System (RHMS)

A modern, user-friendly web application for managing rental properties, tenants, and daily administrative operations with approval workflows and role-based access.

## ✨ Key Features

### 🏢 **For Property Managers**
- **Property Management**: Add, edit, and manage rental houses with real-time status tracking
- **Tenant Management**: Complete tenant lifecycle from application to approval
- **Approval System**: Review and approve tenant applications with one click
- **Financial Dashboard**: Track payments, occupancy rates, and revenue
- **Maintenance Tracking**: Monitor and resolve maintenance requests efficiently

### 👥 **For Tenants**
- **Easy Registration**: Simple online application process
- **Personal Dashboard**: View personal information, payment history, and maintenance requests
- **Secure Login**: Role-based access with approval workflows
- **Payment Management**: Submit and track rent payments
- **Maintenance Requests**: Report issues and track resolution status

## 🛠 Technology Stack

### Frontend
- **React 19.2.0** - Modern, component-based UI
- **Vite 7.3.1** - Lightning-fast development and builds
- **React Router DOM 7.13.1** - Seamless navigation
- **Custom CSS** - Beautiful, responsive design without heavy frameworks

### Backend
- **Flask** - Lightweight, powerful web framework
- **MySQL** - Reliable database for all property and tenant data
- **Flask-CORS** - Secure cross-origin requests
- **Token Authentication** - Secure API access

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- Python 3.8+
- MySQL Server
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd RHMS_Project
   ```

2. **Database Setup**
   ```bash
   # Import database schema
   mysql -u root -p < backend/schema.sql
   ```

3. **Backend Setup**
   ```bash
   # Install Python dependencies
   pip install -r requirements.txt
   
   # Start the backend server
   python backend/app.py
   ```

4. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 🌐 Access Points

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **Admin Login**: Use credentials configured in backend
- **Tenant Portal**: Register and await approval

## 📁 Project Structure

```
RHMS_Project/
├── 📂 backend/
│   ├── 🐍 app.py              # Main Flask application
│   ├── 🗄️ schema.sql          # Database structure
│   ├── 📄 templates/          # HTML templates
│   └── 🎨 static/            # CSS and assets
├── 📂 frontend/
│   ├── 📂 src/
│   │   ├── 🧩 components/    # Reusable UI components
│   │   ├── 📄 pages/         # Application pages
│   │   └── ⚡ main.jsx       # Application entry
│   ├── 📂 public/            # Static assets
│   └── 📦 package.json       # Dependencies
├── 📋 requirements.txt       # Python packages
└── 📖 README.md             # This guide
```

## 🔐 Authentication & Authorization

### Admin Access
- Full system access
- Manage properties and tenants
- Approve/reject applications
- View financial reports

### Tenant Access
- Registration requires approval
- Limited access until approved
- Personal dashboard and features
- Payment and maintenance requests

## 📊 API Endpoints

### Authentication
- `POST /api/tenant-login` - Tenant login
- `GET /api/tenant-dashboard` - Tenant dashboard (authenticated)

### Properties
- `GET /api/houses` - List all properties
- `POST /api/houses` - Add new property
- `PUT /api/houses/<id>` - Update property
- `DELETE /api/houses/<id>` - Remove property

### Tenants
- `GET /api/tenants` - List all tenants
- `POST /api/tenants` - Register new tenant
- `GET /api/pending-tenants` - View pending applications
- `POST /api/approve-tenant/<id>` - Approve tenant application

## 🎨 User Experience

### Modern Design
- Clean, intuitive interface
- Responsive design for all devices
- Smooth animations and transitions
- Professional color scheme

### User-Friendly Features
- Real-time status updates
- Clear approval workflows
- Comprehensive error handling
- Helpful validation messages

## 🔧 Configuration

### Database Settings
Configure MySQL connection in `backend/app.py`:
```python
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''
app.config['MYSQL_DB'] = 'rhms'
```

### CORS Settings
Frontend origins are pre-configured for development:
- `http://localhost:5173`
- `http://127.0.0.1:5173`
- `http://localhost:5176`
- `http://127.0.0.1:5176`

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed**
- Ensure MySQL server is running
- Verify database credentials
- Check database name is 'rhms'

**Frontend Not Loading**
- Confirm backend is running on port 5000
- Check browser console for errors
- Try clearing browser cache

**Port Conflicts**
- Change frontend port: `npm run dev -- --port 5176`
- Stop conflicting processes

**Tenant Registration Issues**
- Check if house is vacant
- Verify email format
- Ensure all required fields are filled

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 📞 Support

For questions, issues, or feature requests:
- Create an issue on GitHub
- Check existing documentation
- Review troubleshooting guide

---

**Built with ❤️ for efficient property management**
