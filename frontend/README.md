# RHMS Frontend

Frontend application for the Rental House Management System built with React and Vite.

## Overview

This is the React frontend that provides a modern, responsive user interface for managing rental properties and tenants. It communicates with a Flask backend API for all data operations.

## Features

- **Admin Dashboard**: Comprehensive management interface
- **Tenant Portal**: Tenant-specific views and actions
- **Property Management**: Interactive house management
- **Real-time Updates**: Dynamic data synchronization
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **React 19.2.0** - Modern UI framework with hooks
- **Vite 7.3.1** - Fast development server and build tool
- **React Router DOM 7.13.1** - Client-side routing
- **Bootstrap 5.3.8** - UI components and styling
- **Chart.js 4.5.1** - Data visualization components

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open browser at `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable React components
│   ├── pages/         # Page-level components
│   ├── api.js         # API communication utilities
│   ├── utils/         # Helper functions
│   ├── assets/        # Static assets
│   └── main.jsx       # Application entry point
├── public/            # Public static files
└── index.html         # HTML template
```

## API Integration

The frontend communicates with the backend API at `http://localhost:5000`. API calls are centralized in `src/api.js`.

### Environment Configuration

The development server is configured to proxy API requests to avoid CORS issues. See `vite.config.js` for configuration.

## Development

### Component Architecture

- **Pages**: Top-level route components
- **Components**: Reusable UI elements
- **API**: Centralized HTTP client
- **Utils**: Shared helper functions

### Styling

- Bootstrap 5 for base styling
- Custom CSS in `src/App.css`
- Component-specific styles as needed

### State Management

- React hooks for local state
- Context API for global application state
- API calls for data synchronization

## Build and Deployment

### Production Build
```bash
npm run build
```

This creates an optimized build in the `dist/` folder ready for deployment.

### Preview Production Build
```bash
npm run preview
```

## Contributing

1. Follow React best practices
2. Use ESLint for code quality
3. Test components thoroughly
4. Maintain responsive design principles

## Troubleshooting

### Common Issues

1. **Port 5173 already in use**
   ```bash
   npm run dev -- --port 5176
   ```

2. **API connection issues**
   - Ensure backend server is running on port 5000
   - Check CORS configuration in backend

3. **Build errors**
   - Clear node_modules and reinstall
   - Check for dependency conflicts

For more details about the full project, see the main [README.md](../README.md).
