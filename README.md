# Rental House Management System (RHMS)

A comprehensive web application for managing rental properties, tenants, and administrative tasks.

## Features

- **Property Management**: Add, edit, and manage rental houses
- **Tenant Management**: Track tenant information, applications, and status
- **Admin Dashboard**: Overview of properties, tenants, and system statistics
- **User Authentication**: Secure login system for admins and tenants
- **Database Integration**: MySQL backend with Flask API

## Technology Stack

### Frontend
- **React 19.2.0** - Modern UI framework
- **Vite 7.3.1** - Fast build tool and dev server
- **React Router DOM 7.13.1** - Client-side routing
- **Bootstrap 5.3.8** - Responsive CSS framework
- **Chart.js 4.5.1** - Data visualization

### Backend
- **Flask 3.0.0** - Python web framework
- **Flask-MySQLdb 2.0.0** - MySQL database integration
- **Flask-Cors 4.0.0** - Cross-origin resource sharing

### Database
- **MySQL** - Primary database for storing application data

## Prerequisites

- Node.js (v18 or higher)
- Python 3.8+
- MySQL Server (XAMPP recommended)
- Git

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd RHMS_Project
```

### 2. Database Setup
1. Start MySQL server (via XAMPP or standalone)
2. Create database named `rhms`
3. Import the database schema:
   ```bash
   mysql -u root -p rhms < backend/schema.sql
   ```

### 3. Backend Setup
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 4. Frontend Setup
```bash
cd frontend
npm install
```

## Running the Application

### Start Backend Server
```bash
# From project root (with virtual environment activated)
python backend/app.py
```
The backend will run on `http://localhost:5000`

### Start Frontend Development Server
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173`

### Alternative: Start Frontend on Different Port
```bash
cd frontend
npm run dev -- --port 5176
```

## Project Structure

```
RHMS_Project/
├── backend/
│   ├── app.py              # Main Flask application
│   ├── schema.sql          # Database schema
│   ├── templates/          # HTML templates
│   └── static/            # Static assets
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── api.js         # API utilities
│   │   └── main.jsx       # App entry point
│   ├── public/            # Public assets
│   └── package.json       # Frontend dependencies
├── requirements.txt       # Python dependencies
└── README.md             # This file
```

## Configuration

### Database Configuration
Database settings are configured in `backend/app.py`:
```python
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''
app.config['MYSQL_DB'] = 'rhms'
```

### CORS Configuration
The backend is configured to accept requests from:
- `http://localhost:5173`
- `http://127.0.0.1:5173`
- `http://localhost:5176`
- `http://127.0.0.1:5176`

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/logout` - User logout

### Houses
- `GET /api/houses` - Get all houses
- `POST /api/houses` - Add new house
- `PUT /api/houses/<id>` - Update house
- `DELETE /api/houses/<id>` - Delete house

### Tenants
- `GET /api/tenants` - Get all tenants
- `POST /api/tenants` - Add new tenant
- `PUT /api/tenants/<id>` - Update tenant
- `DELETE /api/tenants/<id>` - Delete tenant

## Development

### Code Style
- ESLint configured for JavaScript/React
- Python follows PEP 8 guidelines

### Testing
```bash
# Frontend linting
cd frontend
npm run lint

# Backend testing (add tests as needed)
python -m pytest backend/tests/
```

## Troubleshooting

### Common Issues

1. **MySQL Connection Error**
   - Ensure MySQL server is running
   - Check database credentials in `backend/app.py`
   - Verify database `rhms` exists

2. **CORS Issues**
   - Check that frontend URL is in CORS configuration
   - Ensure backend is running before frontend

3. **Port Conflicts**
   - Change frontend port if 5173 is occupied
   - Check for other services using ports 5000, 5173

## License

This project is licensed under the ISC License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions, please use the GitHub issues page.
