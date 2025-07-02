# DiabetaCare: Comprehensive Diabetes Management System

DiabetaCare is a full-stack application designed to help patients with diabetes monitor and manage their condition effectively while facilitating seamless communication with healthcare providers. The application offers comprehensive tools for tracking blood sugar levels, insulin intake, exercise routines, and diet plans.

## 📋 Table of Contents
- [Overview](#overview)
- [Key Features](#key-features)
- [Technical Stack](#technical-stack)
- [Screenshots](#screenshots)
- [Project Structure](#project-structure)
- [Installation and Setup](#installation-and-setup)
- [Usage Guide](#usage-guide)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Authentication and Authorization](#authentication-and-authorization)
- [Deployment](#deployment)

## 🔍 Overview

DiabetaCare bridges the gap between patients and healthcare providers by offering a centralized platform for diabetes management. Patients can log and track their health metrics, while doctors can monitor patient progress, provide feedback, and adjust treatment plans as needed. The system is designed to improve patient outcomes through consistent monitoring and timely interventions.

## ✨ Key Features

### For Patients
- **Blood Sugar Monitoring**: Log and visualize blood sugar readings with automatic categorization (low, normal, intermediate, high)
- **Insulin Tracking**: Record insulin doses and view historical data
- **Exercise Planning**: Access personalized exercise routines and mark completion status
- **Diet Management**: Follow diet recommendations and nutritional guidance
- **Symptom Reporting**: Report any unusual symptoms for doctor review
- **Doctor Communication**: Direct messaging with assigned healthcare providers
- **Health Analytics**: Visual representation of health metrics over time

### For Doctors
- **Patient Dashboard**: Overview of all assigned patients with key health indicators
- **Patient Management**: Add new patients and view detailed patient profiles
- **Health Monitoring**: Track patients' blood sugar trends, insulin usage, and symptom reports
- **Treatment Adjustment**: Update exercise plans, diet recommendations, and medication regimes
- **Alert System**: Receive notifications for concerning health metrics
- **Communication**: Direct messaging with patients for guidance and support

## 🛠️ Technical Stack

### Frontend
- **Framework**: Next.js 15.3.2 with React 19.1.0
- **UI Libraries**: 
  - TailwindCSS for styling
  - Material UI components
  - Framer Motion for animations
- **State Management**: React hooks and context API
- **Data Visualization**: Chart.js with React-ChartJS-2
- **Date Handling**: Date-fns
- **HTTP Client**: Axios
- **Desktop Application**: Electron integration

### Backend
- **Server**: Express.js 5.1.0
- **Database**: PostgreSQL with pg client
- **Authentication**: JWT (JSON Web Tokens)
- **Password Security**: bcrypt for password hashing
- **Email Services**: Nodemailer with Handlebars for templating
- **API Documentation**: Swagger with swagger-jsdoc and swagger-ui-express

## 📸 Screenshots

| 1. Login | 2. Dashboard |
|:---:|:---:|
| ![Login page](Screenshots/login.png) | ![Dashboard page](Screenshots/dashboard.png) |
|:---:|:---:|

| 3. Patients List | 4. Blood Sugar Measurements |
|:---:|:---:|
| ![Patients list](Screenshots/patients-list.png) | ![Blood sugar measurements](Screenshots/blood-sugar-measurements.png) |
|:---:|:---:|

| 5. Insulin Tracking | 6. Exercise Calendar |
|:---:|:---:|
| ![Insulin tracking](Screenshots/insulin-tracking.png) | ![Exercise calendar](Screenshots/exercise-calendar.png) |
|:---:|:---:|

## 📁 Project Structure

### Client-Side Structure
```
client/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── login/              # Login page
│   │   ├── register/           # Registration page
│   │   ├── doctor/             # Doctor-specific pages
│   │   │   └── home/           # Doctor dashboard
│   │   └── patient/            # Patient-specific pages
│   │       ├── home/           # Patient dashboard
│   │       ├── blood-sugar/    # Blood sugar tracking
│   │       ├── my-insulin/     # Insulin tracking
│   │       └── exercises/      # Exercise management
│   ├── components/             # Reusable React components
│   │   ├── layout/             # Layout components like PageTemplate
│   │   ├── auth/               # Authentication components
│   │   └── calendar/           # Calendar and scheduling components
│   ├── services/               # API service connections
│   └── utils/                  # Utility functions
├── main/                       # Electron main process files
└── public/                     # Static assets
```

### Server-Side Structure
```
server/
├── server.js                  # Main Express server file
├── utils/                     # Utility functions and helpers
├── templates/                 # Email templates
└── certs/                     # SSL certificates for HTTPS
```

## 🚀 Installation and Setup

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn package manager

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/DiabetaCare.git
   cd DiabetaCare
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   # Create a .env file with the following variables
   # DATABASE_URL=postgresql://username:password@localhost:5432/diabetacare
   # JWT_SECRET=your_jwt_secret
   # PORT=5000
   # GMAIL_USER=your_email@gmail.com
   # GMAIL_APP_PASSWORD=your_app_password
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd client
   npm install
   npm run dev
   ```

4. **Database Initialization**
   - Execute the SQL scripts in the `DiabetaCare DataBase Connection.session.sql` file to set up the database schema

5. **Running the Application**
   - Web Version: `npm run dev` in the client directory
   - Desktop App: `npm run electron` in the client directory

## 📘 Usage Guide

### Patient Workflow
1. **Login**: Access your account with username and password
2. **Dashboard**: View overview of health metrics and upcoming activities
3. **Blood Sugar**: Log and track blood sugar readings
4. **Insulin**: Record insulin doses and schedule
5. **Exercise**: Follow prescribed exercise routines
6. **Diet**: Access diet plans and nutritional guidance
7. **Symptoms**: Report any unusual symptoms

### Doctor Workflow
1. **Login**: Access your doctor account
2. **Dashboard**: View overview of patient statistics and alerts
3. **Patient List**: Access list of assigned patients
4. **Patient Profile**: View detailed patient health data
5. **Treatment**: Adjust exercise plans, diet recommendations, and medication

## 💾 Database Schema

The database is built with PostgreSQL and includes the following key tables:

- **users**: Core user information with role-based access
- **roles**: User role definitions (patient, doctor, admin)
- **genders**: Gender options
- **blood_sugar_measurements**: Patient blood sugar readings
- **blood_sugar_levels**: Classifications for blood sugar readings
- **insulin_records**: Patient insulin administration records
- **exercises**: Exercise definitions and routines
- **diet_plans**: Nutritional guidance and meal plans
- **symptoms**: Patient-reported symptoms
- **patient_doctor**: Relationship mapping between patients and doctors

## 🔌 API Endpoints

The API follows RESTful design principles and includes endpoints for:

- **Authentication**: `/login`, `/register`, `/refresh-token`
- **User Management**: `/users`, `/users/:id`
- **Blood Sugar**: `/blood-sugar`, `/blood-sugar/:id`
- **Insulin**: `/insulin`, `/insulin/:id`
- **Exercises**: `/exercises`, `/exercises/:id`
- **Diet**: `/diet-plans`, `/diet-plans/:id`
- **Symptoms**: `/symptoms`, `/symptoms/:id`
- **Doctor-Patient**: `/doctor/patients`, `/patient/doctor`

All endpoints are documented using Swagger and can be accessed at `/api-docs` when running the server.

## 🔐 Authentication and Authorization

The system implements a JWT-based authentication system:
- **Token Generation**: Tokens are created at login with 1-hour expiry
- **Role-Based Access**: Different routes are accessible based on user roles (patient/doctor/admin)
- **Password Security**: Passwords are hashed using bcrypt
- **Token Invalidation**: Tokens are invalidated on password change

## 📦 Deployment

The application can be deployed in multiple ways:

### Web Application
- Frontend: Deploy the Next.js app to Vercel or Netlify
- Backend: Deploy the Express server to Heroku, AWS, or similar services
- Database: Use a managed PostgreSQL service like AWS RDS or Heroku Postgres

### Desktop Application
- Build the Electron app for distribution:
  ```bash
  cd client
  npm run build
  ```
- The packaged application will be available for Windows, macOS, and Linux

---

