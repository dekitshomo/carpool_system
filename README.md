# CampusRide — Student Carpool System

> A modern, responsive, and secure **Student Carpool System** designed specifically for university students. Designed as an academic prototype connecting students travelling along identical or overlapping routes between campus and surrounding towns (e.g., *Trashigang ↔ Kanglung Sherubtse Campus*).

---

## 🚀 Key Highlights & Architecture

- **Role-Based Access Control (RBAC):** Distinct interfaces for **Passengers**, **Drivers**, and **Administrators**.
- **Driver Verification Workflow:** Only admin-verified student drivers with valid licenses and active vehicle capacity are authorized to publish trips.
- **ACID Database Transactions:** Overbooking is strictly prevented by using immediate atomic SQLite database transactions during request acceptances and seat updates.
- **Seat Auto-Allocation & Restoration:** 
  - Accepting a passenger request automatically deducts available seats.
  - Cancelling an accepted request automatically restores the seats to the trip.
  - Duplicate requests and self-booking by drivers are strictly barred.
- **Interactive Admin Operations Console:** Complete overview with metrics charts (user registrations, popular routes, status distribution), driver credential reviews, user status controls (suspend/activate), trip moderation, and campus safety reporting.
- **Tech Stack:**
  - **Backend:** Node.js (v24), Express, JWT, BcryptJS, and native `node:sqlite` (DatabaseSync with WAL mode and foreign keys).
  - **Frontend:** React 18, Vite, Tailwind CSS, Lucide React icons, and React Router v6.

---

## 👥 Pre-Configured Demo Accounts

All accounts share the default password: **`password123`**

| Role | Name | Email | Student ID / Details |
| :--- | :--- | :--- | :--- |
| **Admin** | Campus Safety Admin | `admin@college.edu` | `ADMIN001` (Full admin console access) |
| **Driver (Verified)** | Tashi Dorji | `driver1@college.edu` | `STD2023001` (Toyota Prius, BP-1-A1234) |
| **Driver (Verified)** | Sonam Pelden | `driver2@college.edu` | `STD2023002` (Hyundai Creta, BP-2-B5678) |
| **Driver (Pending)** | Dechen Zangmo | `pendingdriver@college.edu` | `STD2023004` (Awaiting admin approval) |
| **Passenger** | Pema Wangmo | `passenger1@college.edu` | `STD2024010` (Computer Science) |
| **Passenger** | Kinley Tshering | `passenger2@college.edu` | `STD2024011` (Mathematics) |

*(Note: On the login page, you can click the quick demo buttons to auto-fill credentials with a single click!)*

---

## 📁 Project Directory Structure

```text
final_project/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # SQLite DatabaseSync connection & WAL configuration
│   │   ├── controllers/
│   │   │   ├── authController.js     # Register, Login, Me, Profile, Password
│   │   │   ├── tripController.js     # Create, Search, Details, My Trips, Cancel
│   │   │   ├── requestController.js  # Request seats, Accept (ACID tx), Reject, Cancel
│   │   │   ├── userController.js     # Vehicles, Driver Verification, Reviews
│   │   │   ├── adminController.js    # KPIs, Charts, User & Trip Moderation
│   │   │   ├── notificationController.js # In-app notification management
│   │   │   └── reportController.js   # Campus safety reports & complaints
│   │   ├── middleware/
│   │   │   └── auth.js               # JWT verification & role-based route guards
│   │   ├── models/
│   │   │   └── schema.js             # Relational schema (8 tables, indexes, constraints)
│   │   ├── routes/                   # Clean Express REST routes
│   │   ├── utils/
│   │   │   ├── notifications.js      # Notification dispatch helper
│   │   │   └── seed.js               # Realistic college carpool seed data
│   │   └── server.js                 # Express server & static production host
│   ├── data/
│   │   └── carpool_system.db         # SQLite database file (WAL mode)
│   ├── test_suite.js                 # Automated business logic test suite (19/19 tests)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Responsive navigation & notification bell
│   │   │   ├── Sidebar.jsx           # Dashboard sidebar navigation
│   │   │   ├── StatusBadge.jsx       # Standardized status badges
│   │   │   ├── Modal.jsx             # Accessible modal component
│   │   │   ├── EmptyState.jsx        # Informative empty states
│   │   │   └── ReportModal.jsx       # Safety issue & complaint report dialog
│   │   ├── context/
│   │   │   ├── AuthContext.jsx       # Global authentication & user state
│   │   │   └── NotificationContext.jsx # Real-time polling & notification state
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx       # Overview, how it works, featured rides
│   │   │   ├── LoginPage.jsx         # Sign in with demo account shortcuts
│   │   │   ├── RegisterPage.jsx      # Student registration with role selection
│   │   │   ├── DashboardPage.jsx     # Student dashboard with metrics & upcoming trips
│   │   │   ├── FindRidePage.jsx      # Search with route/date/time filters & request modal
│   │   │   ├── OfferRidePage.jsx     # Route presets, vehicle selector, verification check
│   │   │   ├── TripDetailsPage.jsx   # Driver & vehicle details, passenger management
│   │   │   ├── MyRequestsPage.jsx    # Submitted booking requests & cancellation
│   │   │   ├── MyTripsPage.jsx       # Driver published trips, accept/reject requests
│   │   │   ├── ProfilePage.jsx       # Student profile, emergency contacts, vehicle info
│   │   │   ├── NotificationsPage.jsx # In-app notifications list & mark as read
│   │   │   └── AdminDashboardPage.jsx# Interactive admin panel with charts & moderation
│   │   ├── services/
│   │   │   └── api.js                # Centralized fetch API client with Bearer auth
│   │   ├── App.jsx                   # Route configurations & role protection guards
│   │   └── main.jsx
│   ├── dist/                         # Production optimized static frontend build
│   └── package.json
├── package.json                      # Unified root scripts
└── README.md
```

---

## ⚙️ Installation & Setup Instructions

### Prerequisites

- **Node.js:** v22.5.0 or higher (v24 recommended for native `node:sqlite` support)
- **npm:** v10 or higher

### Step 1: Install Dependencies

From the project root:

```powershell
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### Step 2: Seed the Database with Realistic Sample Data

Initialize the SQLite database schema and seed test accounts, vehicles, and published campus routes:

```powershell
npm run seed
```

*(You can also run `node src/utils/seed.js` inside the `backend` folder).*

### Step 3: Run Automated Business Logic Tests

Verify the 19 core business rules (transactions, seat counts, cancellation restoration, duplicate prevention):

```powershell
npm test
```

### Step 4: Run the Application

### Gmail verification email setup

To deliver registration verification emails to real inboxes, configure the backend sender with a Gmail App Password:

1. Enable 2-Step Verification on the sender's Google account and create an App Password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
2. Set `SMTP_USER` and `SMTP_PASS` in `backend/.env` (use the App Password, not your Gmail login password).
3. Set `FRONTEND_URL` to the URL students use to open the app (for example, `http://localhost:3000` locally).
4. Restart the backend. The root `npm start` command loads settings from `backend/.env`.

The verification link opens the frontend; `APP_URL` is the backend URL and is not used for email links.

#### Option A: Unified Production Mode (Backend serves Frontend)

The frontend is already built into `frontend/dist/`. Simply start the backend server:

```powershell
npm start
```
Visit: **`http://localhost:5000`** in your browser.

#### Option B: Development Mode (Vite Hot-Reload)

To run the frontend and backend concurrently in development mode:

1. In Terminal 1 (Backend API):
   ```powershell
   npm run start:backend
   ```
   *Runs on port 5000.*

2. In Terminal 2 (Frontend with Vite):
   ```powershell
   npm run start:frontend
   ```
   *Runs on `http://localhost:3000` with automatic `/api` proxying.*

---

## 🔒 Implemented Business Logic & Workflows

1. **Driver Verification:**
   - When registering as a driver, the account starts with `is_verified = 0`.
   - Drivers cannot publish trips until approved by an administrator in the Admin Console.
2. **Trip Publishing Rules:**
   - Available seats must be greater than 0 and cannot exceed the registered vehicle capacity.
   - Travel date cannot be in the past.
3. **Atomic ACID Transactions:**
   - When a driver accepts a passenger's request, an atomic `BEGIN IMMEDIATE` transaction verifies remaining seats, locks the record, decrements `available_seats`, and updates the request status to prevent overbooking.
4. **Seat Restoration on Cancellation:**
   - If a passenger cancels a previously confirmed (`accepted`) booking, the reserved seats are automatically restored back to `available_seats`.
   - If a request was still `pending`, cancelling or rejecting does not affect seat numbers.
5. **Duplicate Prevention:**
   - A student cannot submit duplicate active requests for the same trip.
   - Drivers cannot request seats on trips they are driving.
6. **Moderation & Campus Safety:**
   - Administrators can review submitted safety complaints and suspend accounts or remove violating trips.
   - Removing a trip automatically cancels all passenger requests and notifies affected students.

---

## 📡 API Reference Overview

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register student account (Driver or Passenger)
- `POST /api/auth/login` — Login with email and password
- `GET /api/auth/me` — Get authenticated user details & unread alert count
- `PUT /api/auth/profile` — Update contact, department, emergency details, bio
- `PUT /api/auth/change-password` — Update user account password

### Trips (`/api/trips`)
- `GET /api/trips` — Search available trips with route, date, and seat filters
- `GET /api/trips/:id` — Full trip details, driver info, and booking status
- `POST /api/trips` — Publish new trip (Verified drivers only)
- `GET /api/trips/my-trips` — Driver's published trips with passenger requests
- `PUT /api/trips/:id` — Update pickup point or notes
- `POST /api/trips/:id/cancel` — Cancel trip and notify booked passengers

### Ride Requests (`/api/requests`)
- `POST /api/requests` — Submit seat booking request
- `GET /api/requests/my-requests` — List passenger's submitted ride requests
- `POST /api/requests/:id/accept` — Driver accepts request (atomic seat decrement)
- `POST /api/requests/:id/reject` — Driver declines request
- `POST /api/requests/:id/cancel` — Passenger cancels request (atomic seat restoration)

### Administration (`/api/admin`)
- `GET /api/admin/stats` — Platform metrics, monthly registrations, route frequency
- `GET /api/admin/verifications` — List driver credential submissions
- `POST /api/admin/verifications/:id` — Approve or reject driver verification
- `GET /api/admin/users` — List and filter student user accounts
- `PUT /api/admin/users/:id/status` — Activate, suspend, or deactivate user
- `GET /api/admin/trips` — List all published, completed, or cancelled trips
- `POST /api/admin/trips/:id/remove` — Moderation removal of suspicious trips

### Notifications & Safety (`/api/notifications` & `/api/reports`)
- `GET /api/notifications` — Get in-app alerts
- `PUT /api/notifications/:id/read` — Mark notification as read
- `PUT /api/notifications/mark-all-read` — Mark all as read
- `POST /api/reports` — Report unsafe driving, no-shows, or misconduct
- `GET /api/reports` — View campus reports (Admin only)
- `PUT /api/reports/:id` — Resolve or dismiss reports (Admin only)
