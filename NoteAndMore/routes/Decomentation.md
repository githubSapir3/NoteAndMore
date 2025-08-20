# API Documentation for Frontend

## Base URL: http://localhost:5000/api

## Authentication
All protected routes require JWT token in header:
`Authorization: Bearer <token>`

## Endpoints:

### Auth
- POST /auth/register - User registration
- POST /auth/login - User login
- GET /auth/me - Get current user

### Users
- GET /users/profile - Get user profile
- PUT /users/profile - Update profile
- PUT /users/preferences - Update preferences
- PUT /users/change-password - Change password

### Tasks
- GET /tasks - Get tasks (with filters)
- POST /tasks - Create task
- PUT /tasks/:id - Update task
- DELETE /tasks/:id - Delete task
- PUT /tasks/:id/complete - Mark completed

### Events
- GET /events - Get events
- POST /events - Create event
- PUT /events/:id - Update event
- DELETE /events/:id - Delete event

### Contacts
- GET /contacts - Get contacts
- POST /contacts - Create contact
- PUT /contacts/:id - Update contact
- DELETE /contacts/:id - Delete contact

### Shopping
- GET /shopping - Get shopping lists
- POST /shopping - Create list
- POST /shopping/:id/items - Add item

### Categories
- GET /categories - Get categories
- POST /categories - Create category

# API Summary for Frontend Developers

This backend provides a RESTful API for user management, authentication, tasks, events, contacts, shopping lists, quotes, and categories.  
All protected routes require a JWT token in the `Authorization` header.

## Main Features

- **Authentication:** Register, login, get current user, change password, deactivate/reactivate account.
- **User Profile:** Get and update profile, update preferences, change password, get user statistics.
- **Tasks:** CRUD operations, complete tasks, add/update subtasks, get statistics.
- **Events:** CRUD operations, calendar/month view, upcoming events, add attendees.
- **Contacts:** CRUD operations, favorite/recent/birthday contacts, add call history, get statistics.
- **Shopping Lists:** CRUD operations, add/update/remove items, mark list as completed, get statistics.
- **Quotes:** Get all quotes, get random quote, create quote.
- **Categories:** CRUD operations, reorder categories, get statistics.

## Usage

- All endpoints are under `/api/`.
- Use query parameters for filtering, sorting, and pagination.
- Most endpoints return paginated results and detailed error messages.
- See below for example endpoints:

### Example Endpoints

- `POST /api/auth/register` – Register new user
- `POST /api/auth/login` – Login and get JWT token
- `GET /api/users/profile` – Get current user profile
- `GET /api/tasks` – Get tasks (filter, sort, paginate)
- `POST /api/events` – Create event
- `PUT /api/contacts/:id` – Update contact
- `POST /api/shopping/:id/items` – Add item to shopping list
- `GET /api/categories` – Get categories

For full details, see the endpoint list below or review the backend route files.

---
**Tip:**  
Always send the JWT token in the `Authorization: Bearer <token>` header for protected