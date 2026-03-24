# RHMS Frontend

A modern React app for managing rental properties, built with simplicity and ease of use in mind.

## What It Does

This React frontend provides a clean, responsive interface for managing rental properties and tenants. It talks to a Flask backend for all data operations.

## Key Features

- **Admin Dashboard**: Everything you need to manage properties
- **Tenant Portal**: A dedicated space for tenants to manage their account
- **Property Management**: Easy-to-use house management tools
- **Real-time Updates**: Information stays current automatically
- **Mobile Friendly**: Works great on phones and tablets

## Tech We Used

- **React 19.2.0** - Modern UI framework with hooks
- **Vite 7.3.1** - Fast development server and build tool
- **React Router DOM 7.13.1** - Handles navigation between pages
- **Bootstrap 5.3.8** - Clean, responsive UI components
- **Chart.js 4.5.1** - Simple charts and graphs

## Getting Started

### What You Need
- Node.js 18+ 
- npm or yarn

### Quick Setup

1. **Install Packages**
```bash
npm install
```

2. **Start Development**
```bash
npm run dev
```

3. **Open Browser**
Navigate to `http://localhost:5173`

**If port is busy:**
```bash
npm run dev -- --port 5176
```

### Available Commands

- `npm run dev` - Start development server
- `npm run build` - Create production-ready files
- `npm run preview` - Test production build locally
- `npm run lint` - Check code quality

## How It's Organized

```
frontend/
├── src/
│   ├── components/     # Reusable UI pieces
│   ├── pages/         # Different app pages
│   ├── api.js         # API calls
│   ├── utils/         # Helper functions
│   └── main.jsx       # App starting point
├── public/            # Public static files
└── index.html         # HTML template
```

## How It Works

### Building Blocks
- **Pages**: Main screens like dashboard, login
- **Components**: Reusable UI elements
- **API**: Centralized HTTP client
- **Utils**: Shared helper functions

### Styling
- Bootstrap 5 for base styling
- Custom CSS in `src/App.css`
- Component-specific styles as needed

### Managing Data
- React hooks for local state
- Context API for app-wide state
- API calls for keeping data in sync

## Building for Production

```bash
npm run build
```

This creates optimized files in the `dist/` folder ready for deployment.

## Testing Production Build

```bash
npm run preview
```

## Contributing

1. Follow React best practices
2. Use ESLint for code quality
3. Test components thoroughly
4. Keep mobile users in mind

## Quick Fixes

### Port 5173 Already in Use
   ```bash
   npm run dev -- --port 5176
   ```

### API Connection Issues
   - Make sure backend server is running on port 5000
   - Check CORS settings in backend

### Build Errors
   - Remove node_modules and reinstall
   - Check for package conflicts

For more details about the full project, see the main [README.md](../README.md).
