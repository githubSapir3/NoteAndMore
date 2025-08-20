<!-- # NoteAndMorev

A simple project for managing notes and more.

## Features

- Create, edit, and delete notes
- Organize notes efficiently

## Structure:

The project is organized as follows:

### Database:
- playground-1.mongodb.js - 

### externalUtils:
- '/PostMan/' - json file for PostMan to test all routs.

### NoteAndMore:
- `/backend/` - 
- `/middleware/` - 
- `/routs/` - 
- 'server.js'


1. Clone the repository.
2. Run in terminal 'npm run dev'. -->

# NoteAndMore - Backend

A comprehensive task management system backend built with Node.js, Express, and MongoDB.

## Features

- User authentication and authorization (JWT)
- Task management with priorities and categories
- Event scheduling and calendar management
- Contact management with call history
- Shopping lists with item tracking
- Inspiration quotes system
- User preferences and profile management
- RESTful API design with comprehensive validation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Security**: helmet, express-rate-limit, bcryptjs
- **Development**: nodemon for auto-restart

## Project Structure

<!-- ├── Database/ -->
<!-- │   └── playground-1.mongodb.js     # MongoDB setup and sample data scripts -->
```
NoteAndMore/
├── externalUtils/
│   └── PostMan/                    # Postman collection for API testing
└── backend/
    ├── middleware/
    │   └── auth.js                 # JWT authentication middleware
    ├── models/
    │   ├── User.js                 
    │   └── Task.js               
    <!-- |   └── Event.js
    |   └── Contact.js -->
    model with subtasks support
    ├── routes/
    │   ├── auth.js                 # Authentication routes (register, login, profile)
    │   ├── users.js                # User management routes (profile, preferences)
    │   ├── tasks.js                # Task CRUD operations and filtering
    │   ├── events.js               # Event management and calendar features
    │   ├── contacts.js             # Contact management with call tracking
    │   └── shopping.js             # Shopping list management
    ├── .env                        # Environment variables 
    ├── .gitignore                  # Git ignore file
    ├── package.json                # Dependencies and scripts
    ├── package-lock.json           # Locked dependency versions
    └── server.js                   # Main application entry point
```

## Directory Explanations

### `/middleware/`
Contains Express middleware functions:
- **auth.js**: JWT token verification, user authentication, and authorization levels

### `/models/`
Mongoose schemas and data models:
- **User.js**: User account schema with preferences, validation, and password hashing
- **Task.js**: Task schema with priorities, categories, subtasks, and completion tracking

### `/routes/`
API endpoint definitions organized by feature:
- **auth.js**: User registration, login, password management
- **users.js**: Profile management, preferences, account settings
- **tasks.js**: Task CRUD, filtering, search, statistics
- **events.js**: Calendar events, recurring events, reminders
- **contacts.js**: Contact management, call history, favorites
- **shopping.js**: Shopping lists, item tracking, sharing

### `/Database/`
MongoDB database setup and utilities:
- **playground-1.mongodb.js**: Database initialization, sample data, and test queries

### `/externalUtils/PostMan/`
API testing resources:
- Postman collection files for testing all API endpoints
- Environment configurations for different deployment stages

## Environment Variables

Create a `.env` file in the backend directory:
(or use the one in the ripo)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/task_management_system
JWT_SECRET=TaskManager!2025$SecureApp$JWToken98
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5000
BCRYPT_SALT_ROUNDS=12
```

## Installation & Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd NoteAndMore/backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Configure MongoDB connection string
   - Set JWT secret key

4. Initialize database (optional):
   - Run the MongoDB playground script to create sample data

5. Start development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile information
- `PUT /api/users/preferences` - Update user preferences
- `DELETE /api/users/account` - Deactivate account

### Tasks
- `GET /api/tasks` - Get tasks with filtering and pagination
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PUT /api/tasks/:id/complete` - Mark task as completed
- `GET /api/tasks/stats/summary` - Get task statistics

### Events
- `GET /api/events` - Get events with date filtering
- `POST /api/events` - Create new event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `GET /api/events/calendar/:year/:month` - Get calendar view

### Contacts
- `GET /api/contacts` - Get contacts with search and filtering
- `POST /api/contacts` - Create new contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact
- `PUT /api/contacts/:id/favorite` - Toggle favorite status

### Shopping Lists
- `GET /api/shopping` - Get shopping lists
- `POST /api/shopping` - Create new shopping list
- `POST /api/shopping/:id/items` - Add item to list
- `PUT /api/shopping/:id/items/:itemId` - Update item
- `PUT /api/shopping/:id/complete` - Mark list as completed

## Development Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests (to be implemented)
```

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Request rate limiting
- Input validation and sanitization
- CORS configuration
- Security headers with helmet
- Protected routes with middleware

## Database Features

- MongoDB with Mongoose ODM
- Schema validation and middleware
- Indexing for performance optimization
- Data relationships and references
- Automated timestamps
- Soft delete for user accounts

## TODO List

### High Priority
- [ ] Implement all moduls

- [ ] Implement file upload for avatars and attachments
- [ ] Add data export/import functionality
- [ ] Add real-time notifications with WebSockets
- [ ] Create admin dashboard and user management
- [ ] Add API documentation with Swagger

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.