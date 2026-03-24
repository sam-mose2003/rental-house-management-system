# Rental House Management System (RHMS)

A simple and practical web application for managing rental properties, tenants, and daily administrative tasks.

## What It Does

- **Property Management**: Add, edit, and manage rental houses
- **Tenant Management**: Keep track of tenant information and applications  
- **Admin Dashboard**: See everything at a glance - properties, tenants, and numbers
- **User Login**: Secure access for both admins and tenants
- **Database Storage**: All data safely stored in MySQL

## Technology Stack

### Frontend
- **React 19.2.0** - Modern UI framework
- **Vite 7.3.1** - Fast build tool and dev server
- **React Router DOM 7.13.1** - Client-side routing
- **Bootstrap 5.3.8** - Responsive CSS framework
- **Chart.js 4.5.1** - Data visualization

### Backend
- **Flask 3.0.0** - Web framework that handles requests
- **Flask-MySQLdb 2.0.0** - Connects to MySQL database
- **Flask-Cors 4.0.0** - Lets frontend talk to backend

### Database
- **MySQL** - Where all your property and tenant data lives

## Getting Started

### What You Need
- Node.js (v18 or higher) 
- npm or yarn
- Python 3.8+
- MySQL Server (XAMPP makes this easy)
- Git (optional but helpful)

### Setup Steps

1. **Get the Code**
   ```bash
   git clone <repository-url>
   cd RHMS_Project
   ```

2. **Set Up Database**
   ```bash
   # Start MySQL (using XAMPP is easiest)
   # Create database named 'rhms'
   mysql -u root -p rhms < backend/schema.sql
   ```

3. **Start Backend**
   ```bash
   # Create virtual environment
   python -m venv venv
   
   # Activate it
   # Windows:
   venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   
   # Install what's needed
   pip install -r requirements.txt
   
   # Run the backend
   python backend/app.py
   ```

4. **Start Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Running The App

### Backend
```bash
# From project root (with virtual environment activated)
python backend/app.py
```
The backend runs at `http://localhost:5000`

### Frontend  
```bash
cd frontend
npm run dev
```
The frontend runs at `http://localhost:5173`

**If port 5173 is busy:**
```bash
npm run dev -- --port 5176
```

## Project Layout

```
RHMS_Project/
├── backend/
│   ├── app.py              # Main Flask application
│   ├── schema.sql          # Database structure
│   ├── templates/          # HTML templates
│   └── static/            # CSS and images
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable parts
│   │   ├── pages/         # Different pages
│   │   ├── api.js         # API calls
│   │   └── main.jsx       # App starting point
│   ├── public/            # Public files
│   └── package.json       # Frontend packages
├── requirements.txt       # Python packages
└── README.md             # This file
```

## Settings

### Database
Database connection is in `backend/app.py`:
```python
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''
app.config['MYSQL_DB'] = 'rhms'
```

### Frontend-Backend Connection
The backend accepts requests from:
- `http://localhost:5173`
- `http://127.0.0.1:5173`
- `http://localhost:5176`
- `http://127.0.0.1:5176`

## Available API Calls

### Login & Security
- `POST /api/login` - User login
- `POST /api/logout` - User logout

### Properties
- `GET /api/houses` - Get all houses
- `POST /api/houses` - Add new house
- `PUT /api/houses/<id>` - Update house
- `DELETE /api/houses/<id>` - Delete house

### Tenants
- `GET /api/tenants` - Get all tenants
- `POST /api/tenants` - Add new tenant
- `PUT /api/tenants/<id>` - Update tenant
- `DELETE /api/tenants/<id>` - Delete tenant

## Making Changes

### Code Style
- Frontend uses ESLint for clean JavaScript
- Backend follows Python best practices

### Testing
```bash
# Check frontend code
cd frontend
npm run lint

# Add backend tests as needed
python -m pytest backend/tests/
```

## Common Problems

### Database Won't Connect
- Make sure MySQL server is running
- Check database name is 'rhms'
- Verify username/password in backend/app.py

### Frontend Shows Errors
- Make sure backend is running on port 5000
- Check browser console for specific errors
- Try refreshing the page

### Port Already in Use
- Change frontend port: `npm run dev -- --port 5176`
- Stop other programs using ports 5000, 5173

## Sharing Your Work

1. Fork the project
2. Make your changes
3. Test everything works
4. Send a pull request

## Need Help?

For questions or issues, use the GitHub issues page.
