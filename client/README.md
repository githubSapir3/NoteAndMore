# NoteAndMore Frontend Client

A modern React-based frontend for the NoteAndMore task management system.

## Features

- **Authentication**: Login, registration, and profile management
- **Task Management**: Full CRUD operations with search, filtering, and pagination
- **Dashboard**: Overview with task statistics and quick actions
- **Responsive Design**: Mobile-first design with sidebar navigation
- **Real-time API Integration**: Connected to the Node.js backend
- **Role-based Access**: Admin and user role management

## Tech Stack

- **React 18** - Modern React with hooks
- **React Router 6** - Client-side routing
- **Vite** - Fast build tool and dev server
- **CSS Variables** - Modern CSS with custom properties
- **Fetch API** - Modern HTTP client with authentication

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.jsx      # Main layout with sidebar
│   ├── ProtectedRoute.jsx # Route protection component
│   └── HealthCheck.jsx # Server connectivity check
├── contexts/           # React contexts
│   └── AuthContext.jsx # Authentication state management
├── pages/              # Page components
│   ├── Dashboard.jsx   # Main dashboard
│   ├── Tasks.jsx       # Task management
│   ├── Login.jsx       # Authentication
│   ├── Register.jsx    # User registration
│   ├── Profile.jsx     # User profile
│   ├── Admin.jsx       # Admin panel (admin only)
│   └── ...            # Other resource pages
├── utils/              # Utility functions
│   └── apiClient.js    # API client wrapper
├── App.jsx             # Main app component
├── main.jsx            # React entry point
└── index.css           # Global styles
```

## API Integration

The frontend is fully integrated with the backend API:

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Task Endpoints
- `GET /api/tasks` - List tasks with filtering and pagination
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PUT /api/tasks/:id/complete` - Mark task as complete
- `GET /api/tasks/stats/summary` - Task statistics

### Health Check
- `GET /api/health` - Server connectivity check

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   - Copy `env.example` to `.env`
   - Set `VITE_API_BASE_URL=http://localhost:5000/api`

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- Use functional components with hooks
- Inline styles for component-specific styling
- CSS variables for theming and consistency
- Error boundaries and loading states
- Form validation and error handling

## Authentication Flow

1. **Login/Register**: User credentials are sent to backend
2. **Token Storage**: JWT token stored in localStorage
3. **Route Protection**: Protected routes check authentication
4. **API Calls**: All API requests include Bearer token
5. **Auto-logout**: 401 responses trigger automatic logout

## Role-based Access

- **User Role**: Access to tasks, profile, and basic features
- **Admin Role**: Additional access to admin panel and user management
- **Route Protection**: Admin routes require admin role
- **UI Adaptation**: Admin features hidden for non-admin users

## TODO Items

### Backend Endpoints Required
- `GET /api/users` - List all users (admin only)
- `PUT /api/users/:id/role` - Update user role
- `DELETE /api/users/:id` - Delete user
- Events, Contacts, Shopping, Categories CRUD endpoints

### Frontend Features to Implement
- Calendar view for events
- Contact management forms
- Shopping list functionality
- Category management
- Advanced filtering and search
- Real-time updates
- Offline support

## Browser Support

- Modern browsers with ES6+ support
- Mobile-responsive design
- Progressive Web App features (future)

## Contributing

1. Follow the existing code style
2. Add error handling for all API calls
3. Include loading states for async operations
4. Test on both desktop and mobile
5. Update documentation for new features
