# 🩺 DiabetaCare: Intelligent Diabetes Management Platform

![DiabetaCare Demo](Screenshots/DiabetaCare.gif)

> **A comprehensive full-stack diabetes management system that bridges the gap between patients and healthcare providers through intelligent monitoring, personalized recommendations, and seamless communication.**

## 🎯 Project Overview

DiabetaCare is an innovative healthcare platform designed to revolutionize diabetes management by providing patients with comprehensive tools for monitoring their condition while enabling healthcare providers to deliver personalized care through data-driven insights and automated recommendations.

### 🌟 What Makes DiabetaCare Special?

- **🤖 AI-Powered Recommendations**: Intelligent exercise and diet suggestions based on blood sugar levels and symptoms
- **📊 Real-Time Analytics**: Advanced data visualization and trend analysis
- **🔔 Smart Alert System**: Automated notifications for concerning health metrics
- **💻 Cross-Platform**: Available as both web application and desktop app
- **🔐 Secure & HIPAA-Compliant**: Enterprise-grade security with role-based access control

## 📸 Screenshots

| 1. Patients List | 2. Blood Sugar Measurements |
|:---:|:---:|
| <img src="Screenshots/patients-list.png" width="450" alt="Patients list"> | <img src="Screenshots/blood-sugar-measurements.png" width="450" alt="Blood sugar measurements"> |

| 3. Insulin Tracking | 4. Exercise Calendar |
|:---:|:---:|
| <img src="Screenshots/insulin-tracking.png" width="450" alt="Insulin tracking"> | <img src="Screenshots/exercise-calendar.png" width="450" alt="Exercise calendar"> |

## 🚀 Key Features

### 👨‍⚕️ For Healthcare Providers (Doctors)

| Feature | Description |
|---------|-------------|
| 🏥 **Patient Dashboard** | Comprehensive overview of all assigned patients with key health indicators |
| 👥 **Patient Management** | Add new patients, view detailed profiles, and manage patient relationships |
| 📈 **Health Monitoring** | Track blood sugar trends, insulin usage, exercise adherence, and symptom reports |
| 🎯 **Treatment Planning** | Create personalized exercise routines, diet plans, and medication regimes |
| ⚠️ **Alert System** | Receive real-time notifications for concerning health metrics |
| 💬 **Direct Communication** | Secure messaging system with patients for guidance and support |
| 📊 **Analytics & Reports** | Advanced data visualization and statistical analysis |

### 👤 For Patients

| Feature | Description |
|---------|-------------|
| 🩸 **Blood Sugar Tracking** | Log and visualize readings with automatic categorization (low, normal, intermediate, high) |
| 💉 **Insulin Management** | Record doses, view historical data, and get dosage recommendations |
| 🏃‍♂️ **Exercise Planning** | Access personalized routines and track completion status |
| 🥗 **Diet Management** | Follow customized diet recommendations and nutritional guidance |
| 🤒 **Symptom Reporting** | Report unusual symptoms for immediate doctor review |
| 👨‍⚕️ **Doctor Communication** | Direct messaging with assigned healthcare providers |
| 📊 **Health Analytics** | Visual representation of health metrics and progress over time |

## 🛠️ Technology Stack

### 🎨 Frontend Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Modern React Stack                       │
├─────────────────────────────────────────────────────────────┤
│ • Next.js 15.3.2 (App Router)                              │
│ • React 19.1.0 (Latest Features)                           │
│ • TypeScript 5.8.3 (Type Safety)                           │
│ • TailwindCSS 4.1.11 (Styling)                             │
│ • Material UI 7.1.0 (Components)                           │
│ • Framer Motion 12.12.1 (Animations)                       │
│ • Chart.js + React-ChartJS-2 (Data Visualization)          │
│ • Date-fns 4.1.0 (Date Handling)                           │
│ • Axios 1.9.0 (HTTP Client)                                │
└─────────────────────────────────────────────────────────────┘
```

### ⚙️ Backend Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                   Robust Server Stack                       │
├─────────────────────────────────────────────────────────────┤
│ • Express.js 5.1.0 (API Framework)                         │
│ • PostgreSQL (Primary Database)                             │
│ • JWT Authentication (Security)                             │
│ • Bcrypt (Password Hashing)                                 │
│ • Nodemailer (Email Services)                               │
│ • Handlebars (Email Templates)                              │
│ • Swagger (API Documentation)                               │
│ • CORS (Cross-Origin Support)                               │
└─────────────────────────────────────────────────────────────┘
```

### 🖥️ Desktop Application
```
┌─────────────────────────────────────────────────────────────┐
│                   Electron Integration                      │
├─────────────────────────────────────────────────────────────┤
│ • Electron 36.2.1 (Desktop Framework)                      │
│ • Electron Builder (Packaging)                             │
│ • Cross-Platform Support (Windows, macOS, Linux)           │
│ • Full-Screen Mode with Escape Exit                        │
│ • Hot Reload for Development                                │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
DiabetaCare/
├── 🖥️ client/                          # Frontend Application
│   ├── 📱 src/
│   │   ├── 🏠 app/                     # Next.js App Router
│   │   │   ├── 👨‍⚕️ doctor/            # Doctor-specific pages
│   │   │   │   ├── 🏥 home/            # Doctor dashboard
│   │   │   │   ├── 👥 patients/        # Patient management
│   │   │   │   ├── 🩸 blood-sugar/     # Blood sugar monitoring
│   │   │   │   ├── 💉 insulin-management/ # Insulin tracking
│   │   │   │   ├── 🏃‍♂️ exercises/      # Exercise management
│   │   │   │   ├── 🥗 diets/           # Diet management
│   │   │   │   ├── 🤒 symptoms/        # Symptom tracking
│   │   │   │   └── 📊 statics/         # Analytics & reports
│   │   │   ├── 👤 patient/             # Patient-specific pages
│   │   │   │   ├── 🏠 home/            # Patient dashboard
│   │   │   │   ├── 🩸 blood-sugar/     # Blood sugar tracking
│   │   │   │   ├── 💉 my-insulin/      # Insulin management
│   │   │   │   ├── 🏃‍♂️ exercises/      # Exercise tracking
│   │   │   │   ├── 🥗 diets/           # Diet tracking
│   │   │   │   ├── 🤒 symptoms/        # Symptom reporting
│   │   │   │   ├── 📊 statics/         # Personal analytics
│   │   │   │   └── 👨‍⚕️ my-doctor/      # Doctor communication
│   │   │   ├── 🔐 login/               # Authentication
│   │   │   ├── 📝 register/            # User registration
│   │   │   └── 🚫 unauthorized/        # Access control
│   │   ├── 🧩 components/              # Reusable components
│   │   │   ├── 🏗️ layout/              # Layout components
│   │   │   ├── 🔐 auth/                # Authentication components
│   │   │   ├── 📅 calendar/            # Calendar components
│   │   │   ├── 👥 patients/            # Patient-specific components
│   │   │   └── 🎨 ui/                  # UI components
│   │   ├── 🔌 services/                # API services
│   │   └── 🛠️ utils/                   # Utility functions
│   ├── 🖥️ main/                        # Electron main process
│   └── 📦 public/                      # Static assets
├── ⚙️ server/                          # Backend API
│   ├── 🚀 server.js                    # Main Express server
│   ├── 🛠️ utils/                       # Utility functions
│   ├── 📧 templates/                   # Email templates
│   └── 🔒 certs/                       # SSL certificates
├── 📸 Screenshots/                     # Application screenshots
├── 🗄️ Database/                        # Database scripts
└── 📋 Documentation/                   # Project documentation
```

## 🚀 Quick Start Guide

### 📋 Prerequisites
- **Node.js** (v18 or higher) 🟢
- **PostgreSQL** (v14 or higher) 🐘
- **npm** or **yarn** package manager 📦

### ⚡ Installation Steps

1. **📥 Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/DiabetaCare.git
   cd DiabetaCare
   ```

2. **🗄️ Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb diabetacare
   
   # Execute database schema
   psql -d diabetacare -f "DiabetaCare DataBase Connection.session copy.sql"
   ```

3. **⚙️ Backend Setup**
   ```bash
   cd server
   npm install
   
   # Create .env file
   cp .env.example .env
   # Edit .env with your configuration:
   # DATABASE_URL=postgresql://username:password@localhost:5432/diabetacare
   # JWT_SECRET=your_secure_jwt_secret
   # PORT=5000
   # GMAIL_USER=your_email@gmail.com
   # GMAIL_APP_PASSWORD=your_app_password
   
   npm run dev
   ```

4. **🎨 Frontend Setup**
   ```bash
   cd client
   npm install
   npm run dev
   ```

5. **🖥️ Desktop App (Optional)**
   ```bash
   cd client
   npm run electron
   ```

## 🔌 API Endpoints

### 🔐 Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/register` | User registration with auto-generated password |
| `POST` | `/login` | User authentication with JWT token |
| `POST` | `/refresh-token` | Token refresh mechanism |

### 👥 User Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/users` | Get all users (Admin/Doctor only) |
| `GET` | `/users/:id` | Get specific user profile |
| `PUT` | `/users/:id` | Update user information |

### 🩸 Blood Sugar Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/blood-sugar-measurements/patient/:patient_id` | Get patient's blood sugar history |
| `POST` | `/blood-sugar-measurements/patient/add` | Add new blood sugar reading |
| `PUT` | `/blood-sugar-measurements/patient/update` | Update blood sugar reading |
| `GET` | `/blood-sugar-alerts` | Get blood sugar alerts (Doctor only) |

### 💉 Insulin Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/insulin-recommendation` | Get insulin dosage recommendations |
| `POST` | `/insulin-recommendation/create` | Create new insulin recommendation |
| `GET` | `/insulin-recommendation/patient/` | Get patient-specific insulin advice |
| `POST` | `/insulin-patient-logs/add` | Log insulin administration |

### 🏃‍♂️ Exercise Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/exercises` | Get available exercises |
| `POST` | `/exercises/patient/add` | Assign exercise to patient |
| `GET` | `/exercise-recommendation/:patient_id` | Get AI-powered exercise recommendations |
| `POST` | `/exercise-logs/patient/add` | Log exercise completion |

### 🥗 Diet Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/diet-types` | Get available diet plans |
| `POST` | `/diet-plans/patient/add` | Assign diet to patient |
| `GET` | `/diet-recommendation/:patient_id` | Get AI-powered diet recommendations |
| `POST` | `/diet-logs/patient/add` | Log diet adherence |

### 🤒 Symptom Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/symptoms/patient/:patient_id` | Get patient symptoms |
| `POST` | `/symptoms/patient/add` | Add new symptom report |
| `GET` | `/symptom_types` | Get available symptom types |

### 📊 Analytics & Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/doctor/dashboard/stats` | Doctor dashboard statistics |
| `GET` | `/patient/dashboard/stats` | Patient dashboard statistics |
| `GET` | `/patient/graph-data/:patient_id` | Comprehensive patient analytics |

## 🗄️ Database Schema

### Core Tables
```sql
-- User Management
users (id, username, email, phone_number, role_id, password, full_name, gender_id, birth_date)
roles (id, role_name) -- patient, doctor, admin
genders (id, gender_name)

-- Health Monitoring
blood_sugar_measurements (id, patient_id, value, measured_at, blood_sugar_level_id)
blood_sugar_levels (id, label, min_value, max_value) -- Low, Normal, Intermediate, High
insulin_logs (id, patient_id, log_date, insulin_dosage_ml, note)

-- Treatment Management
exercises (id, exercise_name, description, intensity_level, duration_minutes)
patient_exercises (id, patient_id, exercise_id, start_date, end_date, status)
exercise_logs (id, patient_exercise_id, log_date, is_completed, note)

diet_types (id, diet_name, description, nutritional_info)
patient_diets (id, patient_id, diet_id, start_date, end_date)
diet_logs (id, patient_diet_id, log_date, is_completed, note)

-- Symptom Tracking
symptom_types (id, symptom_name, description)
patient_symptoms (id, patient_id, symptom_id, created_at)

-- Relationships
patient_doctor (patient_id, doctor_id) -- Many-to-many relationship

-- AI Recommendations
recommendation_rules (id, min_blood_sugar, max_blood_sugar, required_symptoms, exercise_id, diet_id)
insulin_recommendations (id, min_blood_sugar, max_blood_sugar, level_description, insulin_dosage_ml, note)
```

## 🔐 Security Features

### 🔒 Authentication & Authorization
- **JWT-based authentication** with 1-hour token expiry
- **Role-based access control** (Patient, Doctor, Admin)
- **Password hashing** using bcrypt with salt rounds
- **Token invalidation** on password change
- **CORS protection** for cross-origin requests

### 🛡️ Data Protection
- **Input validation** and sanitization
- **SQL injection prevention** using parameterized queries
- **HTTPS enforcement** with SSL certificates
- **Environment variable** configuration for sensitive data

## 📊 Analytics & Intelligence

### 🤖 Recommendations System
The system uses intelligent algorithms to provide personalized recommendations:

1. **Exercise Recommendations**: Based on blood sugar levels and current symptoms
2. **Diet Recommendations**: Personalized meal plans considering health metrics
3. **Insulin Dosage**: Calculated recommendations based on blood sugar averages
4. **Alert System**: Automated notifications for concerning health patterns

### 📈 Data Visualization
- **Time-series charts** for blood sugar trends
- **Completion rate analytics** for exercises and diets
- **Statistical summaries** with averages, min/max values
- **Time-of-day analysis** for better pattern recognition

## 🚀 Deployment Options

### 🌐 Web Application
```bash
# Frontend (Vercel/Netlify)
cd client
npm run build
# Deploy to your preferred platform

# Backend (Heroku/AWS/DigitalOcean)
cd server
npm start
# Deploy with environment variables configured
```

### 🖥️ Desktop Application
```bash
cd client
npm run build
# Creates distributable packages for:
# - Windows (.exe)
# - macOS (.dmg)
# - Linux (.AppImage)
```


### 💡 Feature Requests
We're always looking for ways to improve DiabetaCare. Share your ideas through our [Feature Request Form](https://github.com/MYounesDev/DiabetaCare/issues/new).



## 🙏 Acknowledgments

- **Healthcare Professionals** who provided domain expertise
- **Open Source Community** for the amazing tools and libraries
- **Beta Testers** who helped refine the user experience


---

<div align="center">

**Made with ❤️ for better diabetes management**

</div>

