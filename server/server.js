require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const nodemailer = require('nodemailer');
const { createCipheriv } = require("crypto");


const app = express();
const PORT = process.env.PORT || 5000;
const jwtSecretKey = process.env.JWT_SECRET;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});







// Token verification function
async function verifyToken(token, secret) {
  if (!token) {
    throw new Error('No token provided');
  }

  if (!secret) {
    throw new Error('JWT secret is not defined');
  }

  try {
    const decoded = jwt.verify(token, secret);
    userId = decoded.id;
    const query = `SELECT * FROM users WHERE id = $1`;
    const result = await pool.query(query, [userId]);
    const user = result.rows[0];

    if (!user) {
      console.log('User not found:', userId);
      throw new Error('User not found');
    }

    if (user.password_changed_at &&
      (new Date(decoded.tokenCreatedAt) < new Date(user.password_changed_at))) {
      throw new Error('Password has been changed, please login again');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.log('Token expired:', error.message);
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      console.log('Invalid token:', error.message);
      throw new Error('Invalid token');
    }
    console.log('Token verification error:', error.message);
    throw new Error(error.message || 'Token verification failed');
  }
}

// Authentication middleware
const authenticate = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];


  console.log(`\n--- AUTH DEBUG ---`);
  console.log(`Request: ${req.method} ${req.originalUrl}`);



  try {
    const decoded = await verifyToken(token, jwtSecretKey);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};





const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD // This is your 16-digit app password
  }
});




// Read the email template
const emailTemplatePath = path.join(__dirname, 'templates', 'welcome-email.html');
const emailTemplate = fs.readFileSync(emailTemplatePath, 'utf8');
const compiledTemplate = handlebars.compile(emailTemplate);

app.post('/register', async (req, res) => {
  const { username, email, phone_number, full_name, birth_date, gender, role } = req.body;

  if (!username || !email || !phone_number || !full_name || !birth_date || !gender || !role) {
    console.log('Missing fields in registration:', req.body);
    return res.status(400).json({ message: 'All fields are required' });
  }

  const randomPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(randomPassword, 10);

  try {
    // First, get the role_id and gender_id from their respective tables
    const roleQuery = 'SELECT id FROM roles WHERE role_name = $1';
    const genderQuery = 'SELECT id FROM genders WHERE gender_name = $1';

    const roleResult = await pool.query(roleQuery, [role]);
    const genderResult = await pool.query(genderQuery, [gender]);

    if (roleResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }
    if (genderResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid gender specified' });
    }

    const roleId = roleResult.rows[0].id;
    const genderId = genderResult.rows[0].id;

    // Now insert the user with the correct foreign keys
    const query = `
      INSERT INTO users (
        username, 
        email, 
        phone_number, 
        role_id, 
        password, 
        full_name, 
        gender_id, 
        birth_date
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *`;

    // Add user to database with foreign keys
    const result = await pool.query(query, [
      username,
      email,
      phone_number,
      roleId,
      hashedPassword,
      full_name,
      genderId,
      birth_date
    ]);
    const newUser = result.rows[0];
    const { password: _, ...userData } = newUser;

    const token = jwt.sign(
      { email: newUser.email, role: newUser.role, id: newUser.id, tokenCreatedAt: new Date() },
      jwtSecretKey,
      { expiresIn: '1h' }
    );

    //check if a doctor add the patient (then the doctor is the patient's doctor and will add the relation between them to the database)
    const tokenFromHeader = req.headers['authorization']?.split(' ')[1];
    if (tokenFromHeader) {
      try {
        const decoded = await verifyToken(tokenFromHeader, jwtSecretKey);
        if (decoded.role === 'doctor' && role === 'patient') {
          const query = `INSERT INTO "patient_doctor" (patient_id, doctor_id) VALUES ($1, $2)`;
          await pool.query(query, [newUser.id, decoded.id]);
        }
      } catch (error) {
        console.error('Error verifying token for doctor-patient relationship:', error);
        // Proceed without the relationship if token verification fails
      }
    }

    // Prepare email data
    const emailData = {
      userName: username,
      full_name: full_name,
      randomPassword: randomPassword,
      loginUrl: `${process.env.FRONTEND_URL}/login`
    };

    // Compile template with data
    const htmlContent = compiledTemplate(emailData);

    // Send welcome email with login credentials using nodemailer
    try {
      await transporter.sendMail({
        from: `"DiabetaCare" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Welcome to DiabetaCare - Your Account Information',
        html: htmlContent,
      });
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Still proceed with registration even if email fails
    }

    // Respond to client
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



app.post('/login', async (req, res) => {

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'user name and password required' });
  }

  const query = `SELECT 
    users.id, 
    users.username, 
    users.full_name , 
    users.email, 
    users.phone_number , 
    users.birth_date , 
    roles.role_name AS role, 
    genders.gender_name AS gender, 
    users.password, 
    users.profile_picture
    FROM users 
    INNER JOIN roles ON users.role_id = roles.id
    INNER JOIN genders ON users.gender_id = genders.id
    WHERE users.username = $1`;
  try {
    const result = await pool.query(query, [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { email: user.email, role: user.role, id: user.id, tokenCreatedAt: new Date() },
      jwtSecretKey,
      { expiresIn: '1h' }
    );

    const { password: _, ...userData } = user;


    res.status(200).json({
      message: 'Login successful',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }

});




app.get('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `SELECT * FROM users WHERE id = $1`;
    const result = await pool.query(query, [userId]);
    const user = result.rows[0];

    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    const { password: _, ...userData } = user;

    res.json({
      message: 'User profile retrieved successfully',
      user: userData
    });

  } catch (error) {
    console.error('Error retrieving profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }

})

app.post('/change-password', authenticate, async (req, res) => {
  console.log('change-password endpoint hit'); // DEBUGGING

  const { currentPassword, newPassword } = req.body;
  const { id } = req.user;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Both passwords are required' });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({ message: 'New password cannot be the same as current password' });
  }

  const query = `SELECT * FROM users WHERE id = $1`;
  let user;
  try {

    const result = await pool.query(query, [id]);
    user = result.rows[0];
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user from database:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }

  try {
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    user.password = hashedPassword;



    user.password_changed_at = new Date();

    const updateQuery = `UPDATE users SET password = $1, password_changed_at = $2 WHERE id = $3 RETURNING *`;

    try {
      await pool.query(updateQuery, [hashedPassword, user.password_changed_at, id]);
    } catch (error) {
      console.error('Error updating password in database:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    const token = jwt.sign(
      { email: user.email, role: user.role, id: user.id, tokenCreatedAt: new Date() },
      jwtSecretKey,
      { expiresIn: '1h' }
    );


    const { password: _, ...userData } = user;
    res.json({
      message: 'Password changed successfully',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Error during password change:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/blood-sugar-alerts', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const query = `SELECT * FROM blood_sugar_measurements`;
    const result = await pool.query(query);
    const bloodSugarAlerts = result.rows;
    res.json({
      message: 'Blood sugar alerts retrieved successfully',
      bloodSugarAlerts: bloodSugarAlerts
    });
  } catch (error) {
    console.error('Error retrieving blood sugar alerts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.get('/users', authenticate, authorize('admin'), async (req, res) => {
  try {
    const query = `SELECT *
    FROM users
    ORDER BY unaccent(lower(full_name));`;
    const result = await pool.query(query);
    const users = result.rows;
    res.json({
      message: 'Users retrieved successfully',
      users: users
    });
  } catch (error) {
    console.error('Error retrieving users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.get('/users/:userId', authenticate, async (req, res) => {
  const userId = req.params.userId;

  if (req.user.role !== 'admin' && req.user.role !== 'doctor' && req.user.id !== userId) {
    return res.status(403).json({ message: 'Access denied' });
  }
  try {
    const query = `SELECT * FROM users WHERE id = $1`;
    const result = await pool.query(query, [userId]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.user.role === 'doctor' && req.user.id !== userId && user.role_id !== 1) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { password, ...userData } = user;
    res.json({
      message: 'User retrieved successfully',
      user: userData
    });
  } catch (error) {
    console.error('Error retrieving user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
})

app.put('/users/:userId', authenticate, async (req, res) => {
  const userId = req.params.userId;

  if (req.user.role !== 'admin' && req.user.role !== 'doctor' && req.user.id !== userId) {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const { full_name, email, phone_number, birth_date, gender, role, profile_picture } = req.body;

    if (!full_name || !email || !phone_number || !birth_date || !gender || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const queryTemp = `SELECT * FROM users WHERE id = $1`;
    const resultTemp = await pool.query(queryTemp, [userId]);
    const userTemp = resultTemp.rows[0];

    if (req.user.role === 'doctor' && req.user.id !== userId && userTemp.role_id !== 1) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const genderQuery = `SELECT id FROM genders WHERE gender_name = $1`;
    const genderResult = await pool.query(genderQuery, [gender]);
    const genderId = genderResult.rows[0].id;

    const roleQuery = `SELECT id FROM roles WHERE role_name = $1`;
    const roleResult = await pool.query(roleQuery, [role]);
    const roleId = roleResult.rows[0].id;

    const query = `UPDATE users SET full_name = $1, email = $2, phone_number = $3, birth_date = $4, gender_id = $5, role_id = $6, profile_picture = $7 WHERE id = $8`;
    const result = await pool.query(query, [full_name, email, phone_number, birth_date, genderId, roleId, profile_picture, userId]);
    res.json({
      message: 'User updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
})


app.get('/symptoms', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const query = `SELECT * FROM patient_symptoms`;
    const result = await pool.query(query);
    const symptoms = result.rows;
    res.json({
      message: 'Symptoms retrieved successfully',
      symptoms: symptoms
    });
  } catch (error) {
    console.error('Error retrieving symptoms:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/diet-plans', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const query = `SELECT * FROM diet_types`;
    const result = await pool.query(query);
    const dietPlans = result.rows;
    res.json({
      message: 'Diet plans retrieved successfully',
      dietPlans: dietPlans
    });
  } catch (error) {
    console.error('Error retrieving diet plans:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



app.get('/patients', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const findRoleId = `SELECT id FROM roles WHERE role_name = $1`;
    const roleResult = await pool.query(findRoleId, ['patient']);
    const role_id = roleResult.rows[0].id;



    const query = `SELECT users.id,username,full_name, email,phone_number,birth_date,gender_name as gender,role_name as role,profile_picture
    FROM users
    INNER JOIN genders ON users.gender_id = genders.id
    INNER JOIN roles ON users.role_id = roles.id
    WHERE role_id = $1
    ORDER BY unaccent(lower(full_name));`;
    const result = await pool.query(query, [role_id]);
    const patients = result.rows;

    //return without passwords
    const patientsInSession = patients.map(patient => {
      const { password, ...patientData } = patient;
      return patientData;
    });


    res.json({
      message: 'Patients retrieved successfully',
      patients: patientsInSession
    });

  } catch (error) {
    console.error('Error retrieving patients:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/patients/:patientId', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const patientId = req.params.patientId;
  const query = `DELETE FROM users WHERE id = $1`;
  try {
    const result = await pool.query(query, [patientId]);
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/doctors', authenticate, authorize('admin'), async (req, res) => {
  try {

    const findRoleId = `SELECT id FROM roles WHERE role_name = $1`;
    const roleResult = await pool.query(findRoleId, 'doctor');
    const role_id = roleResult.rows[0].id;

    const query = `SELECT * FROM users WHERE role_id = $1
    ORDER BY unaccent(lower(full_name));`;
    const result = await pool.query(query, [role_id]);
    const doctors = result.rows;

    //return without passwords
    const doctorsInSession = doctors.map(patient => {
      const { password, ...doctorData } = patient;
      return doctorData;
    });


    res.json({
      message: 'Doctor retrieved successfully',
      doctors: doctorsInSession
    });

  } catch (error) {
    console.error('Error retrieving doctors:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.post('/profile-picture/update', authenticate, async (req, res) => {
  const { pictureCode } = req.body;

  if (!pictureCode) {
    return res.status(400).json({ message: 'Token and picture required' });
  }

  try {
    const userId = req.user.id;

    const query = `UPDATE users SET profile_picture = $1 WHERE id = $2 RETURNING *`;
    const result = await pool.query(query, [pictureCode, userId]);
    const updatedUser = result.rows[0];

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile picture updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({ message: 'Internal server error' });
  }

});

// Doctor Dashboard Endpoints
app.get('/doctor/dashboard/stats', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  try {

    // Get total patients count
    const patientsQuery = `
      SELECT COUNT(*) as total_patients 
      FROM patient_doctor 
      `;
    const patientsResult = await pool.query(patientsQuery);
    const totalPatients = patientsResult.rows[0].total_patients || 0;

    // Get pending exercises count
    const exercisesQuery = `
      SELECT COUNT(*) as pending_exercises 
      FROM patient_exercises pe
`;
    const exercisesResult = await pool.query(exercisesQuery);
    const pendingExercises = exercisesResult.rows[0].pending_exercises || 0;

    // Get diet plans count
    const dietsQuery = `
      SELECT COUNT(*) as diet_plans 
      FROM diet_types 
`;
    const dietsResult = await pool.query(dietsQuery);
    const dietPlans = dietsResult.rows[0].diet_plans || 0;

    // Get new symptoms count
    const symptomsQuery = `
      SELECT COUNT(*) as new_symptoms 
      FROM patient_symptoms ps
      JOIN patient_doctor pd ON ps.patient_id = pd.patient_id
      WHERE  ps.created_at > NOW() - INTERVAL '24 hours'`;
    const symptomsResult = await pool.query(symptomsQuery);
    const newSymptoms = symptomsResult.rows[0].new_symptoms || 0;

    // Get blood sugar alerts count
    const alertsQuery = `
      SELECT COUNT(*) as blood_sugar_alerts 
      FROM blood_sugar_measurements bsm
      JOIN patient_doctor pd ON bsm.patient_id = pd.patient_id
      WHERE (bsm.value > 180 OR bsm.value < 70) AND 
      bsm.measured_at > NOW() - INTERVAL '24 hours'`;
    const alertsResult = await pool.query(alertsQuery);
    const bloodSugarAlerts = alertsResult.rows[0].blood_sugar_alerts || 0;

    res.json({
      stats: {
        totalPatients,
        pendingExercises,
        dietPlans,
        newSymptoms,
        bloodSugarAlerts
      }
    });

  } catch (error) {
    console.error('Error retrieving doctor dashboard stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});










app.get('/exercise-types', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const query = `SELECT * FROM exercise_types`;
    const result = await pool.query(query);
    const exercisePlans = result.rows;

    res.json({
      message: 'Exercise plans retrieved successfully',
      exercisePlans: exercisePlans
    });

  } catch (error) {
    console.error('Error retrieving exercise types:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/exercise-types/create', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    return res.status(400).json({ message: 'Name and description are required' });
  }

  try {
    const query = `INSERT INTO exercise_types (exercise_name, description) VALUES ($1, $2) RETURNING *`;
    const result = await pool.query(query, [name, description]);
    const newExerciseType = result.rows[0];

    res.json({
      message: 'Exercise type created successfully',
      exerciseType: newExerciseType
    });

  } catch (error) {
    console.error('Error creating exercise type:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.post('/exercise-types/update', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const { exercise_id, name, description } = req.body;

  if (!exercise_id || !name || !description) {
    return res.status(400).json({ message: 'ID, name, and description are required' });
  }

  try {
    const query = `UPDATE exercise_types SET exercise_name = $1, description = $2 WHERE id = $3 RETURNING *`;
    const result = await pool.query(query, [name, description, exercise_id]);
    const updatedExerciseType = result.rows[0];

    res.json({
      message: 'Exercise type updated successfully',
      exerciseType: updatedExerciseType
    });

  } catch (error) {
    console.error('Error updating exercise type:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.delete('/exercise-types/:exercise_id', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  
  const { exercise_id } = req.params;

  if (!exercise_id) {
    return res.status(400).json({ message: 'Exercise ID is required' });
  }

  try {
    const query = `DELETE FROM exercise_types WHERE exercise_id = $1`;
    const result = await pool.query(query, [exercise_id]);
    res.json({ message: 'Exercise type deleted successfully' });
  } catch (error) {
    console.error('Error deleting exercise type:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.get('/exercise-types/:exercise_id/sum-patient-assignments', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const { exercise_id } = req.params;

  if (!exercise_id) {
    return res.status(400).json({ message: 'Exercise ID is required' });
  }

  try {
    const query = `SELECT COUNT(*) as total_assignments 
    FROM patient_exercises 
    WHERE exercise_id = $1`;
    const result = await pool.query(query, [exercise_id]);
    const totalAssignments = result.rows[0].total_assignments || 0;
    
    res.json({
      message: 'Total patient assignments retrieved successfully',
      totalAssignments: totalAssignments
    });
  } catch (error) {
    console.error('Error retrieving total patient assignments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});






app.get('/patient-exercises', authenticate, authorize('admin', 'doctor'), async (req, res) => {

  const query = `SELECT * 
  FROM patient_exercises
  INNER JOIN exercise_types ON patient_exercises.exercise_id = exercise_types.exercise_id
  ORDER BY start_date DESC`;

  try {
    const result = await pool.query(query);
    const patientExercises = result.rows;
    res.json({
      message: 'Patient exercises retrieved successfully',
      patientExercises:
      patientExercises
    });
  } catch (error) {
    console.error('Error retrieving patient exercises:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/patient-exercises/patient', authenticate, authorize('admin', 'doctor', 'patient'), async (req, res) => {
  const { patient_id } = req.body;
  if(!patient_id){
    return res.status(400).json({ message: 'Patient ID is required' });
  }

  if(req.user.role_id === 'patient' && req.user.id !== patient_id){
    return res.status(403).json({ message: 'Access denied' });
  }


  const query = `SELECT * FROM patient_exercises WHERE patient_id = $1`;
  try {
    const result = await pool.query(query, [patient_id]);
    const patientExercises = result.rows;
    res.json({
      message: 'Patient exercises retrieved successfully',
      patientExercises: patientExercises
    });
  } catch (error) {
    console.error('Error retrieving patient exercises:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/patient-exercises/patient/add', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const { patient_id, exercise_id, status, start_date, end_date } = req.body;

  const doctor_id = req.user.id;


  if (!patient_id || !exercise_id || !status || !start_date) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const query = `INSERT INTO patient_exercises (patient_id, exercise_id, doctor_id, status, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;

  try {
    const result = await pool.query(query, [patient_id, exercise_id, doctor_id, status, start_date, end_date]);
    const newPatientExercise = result.rows[0];

    res.json({
      message: 'Patient exercise added successfully',
      patientExercise: newPatientExercise
    });
  } catch (error) {
    console.error('Error adding patient exercise:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/patient-exercises/patient/update', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const { patient_exercise_id, patient_id, exercise_id, status, start_date, end_date } = req.body;

  const doctor_id = req.user.id;
  
  if (!patient_exercise_id || !patient_id || !exercise_id || !doctor_id || !status || !start_date) {
    return res.status(400).json({ message: 'All fields are required' });
  }


  const query = `UPDATE patient_exercises SET patient_id = $1, exercise_id = $2, doctor_id = $3, status = $4, start_date = $5, end_date = $6 WHERE id = $7 RETURNING *`;

  try {
    const result = await pool.query(query, [patient_id, exercise_id, doctor_id, status, start_date, end_date, patient_exercise_id]);
    const updatedPatientExercise = result.rows[0];

    res.json({
      message: 'Patient exercise updated successfully',
      patientExercise: updatedPatientExercise
    });
  } catch (error) {
    console.error('Error updating patient exercise:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.delete('/patient-exercises/patient/delete/:patient_exercise_id', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const { patient_exercise_id } = req.params;

  if (!patient_exercise_id) {
    return res.status(400).json({ message: 'Patient exercise ID is required' });
  }



  const query = `DELETE FROM patient_exercises WHERE id = $1`;

  try {
    const result = await pool.query(query, [patient_exercise_id]);
    res.json({ message: 'Patient exercise deleted successfully' });
  } catch (error) {
    console.error('Error deleting patient exercise:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.get('/patient-exercises/patient/completed', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const { patient_id } = req.body;
  const query = `SELECT * FROM patient_exercises WHERE patient_id = $1 AND status = 'completed'`;
  if (!patient_id) {
    return res.status(400).json({ message: 'Patient ID is required' });
  }

  try {
    const result = await pool.query(query, [patient_id]);
    const completedExercises = result.rows;
    res.json({
      message: 'Completed exercises retrieved successfully',
      completedExercises: completedExercises
    });
  } catch (error) {
    console.error('Error retrieving completed exercises:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.get('/patient-exercises/patient/pending', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const { patient_id } = req.body;
  const query = `SELECT * FROM patient_exercises WHERE patient_id = $1 AND status = 'pending'`;
  if (!patient_id) {
    return res.status(400).json({ message: 'Patient ID is required' });
  }

  try {
    const result = await pool.query(query, [patient_id]);
    const pendingExercises = result.rows;
    res.json({
      message: 'Pending exercises retrieved successfully',
      pendingExercises:
      pendingExercises
    });
  } catch (error) {
    console.error('Error retrieving pending exercises:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.get('/patient-exercises/patient', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const { patient_id } = req.body;
  const query = `SELECT * FROM patient_exercises WHERE patient_id = $1`;
  if (!patient_id) {
    return res.status(400).json({ message: 'Patient ID is required' });
  }

  try {
    const result = await pool.query(query, [patient_id]);
    const patientExercises = result.rows;
    res.json({
      message: 'Patient exercises retrieved successfully',
      patientExercises:
      patientExercises
    });
  } catch (error) {
    console.error('Error retrieving patient exercises:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/patient-exercises/pending', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const query = `SELECT * FROM patient_exercises WHERE status = 'pending'`;
  try {
    const result = await pool.query(query);
    const pendingExercises = result.rows;
    res.json({
      message: 'Pending exercises retrieved successfully',
      pendingExercises: pendingExercises
    });
  } catch (error) {
    console.error('Error retrieving pending exercises:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.get('/patient-exercises/completed', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const query = `SELECT * FROM patient_exercises WHERE status = 'completed'`;
  try {
    const result = await pool.query(query);
    const completedExercises = result.rows;
    res.json({
      message: 'Completed exercises retrieved successfully',
      completedExercises: completedExercises
    });
  } catch (error) {
    console.error('Error retrieving completed exercises:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});











app.get('/exercise-logs/',authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const query = `SELECT 
    exercise_logs.*,
    patient_exercises.exercise_id,
    exercise_types.exercise_name
    FROM exercise_logs
    INNER JOIN patient_exercises ON exercise_logs.patient_exercise_id = patient_exercises.id
    INNER JOIN exercise_types ON patient_exercises.exercise_id = exercise_types.exercise_id
    ORDER BY log_date DESC`;
  try { 
    const result = await pool.query(query);
    const exerciseLogs = result.rows;
    res.json({
      message: 'Exercise logs retrieved successfully',
      exerciseLogs: exerciseLogs
    });
  } catch (error) {
    console.error('Error retrieving exercise logs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/exercise-logs/patient', authenticate, authorize('admin', 'doctor', 'patient'), async (req, res) => {
  const { patient_id } = req.body;

  
  if (!patient_id) {
    return res.status(400).json({ message: 'Patient ID is required' });
  }

  if (req.user.role_id === 'patient' && req.user.id !== patient_id) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const query = `SELECT * FROM exercise_logs WHERE patient_id = $1 ORDER BY log_date DESC`;

  try {
    const result = await pool.query(query, [patient_id]);
    const exerciseLogs = result.rows;
    res.json({
      message: 'Exercise logs retrieved successfully',
      exerciseLogs: exerciseLogs
    });
  } catch (error) {
    console.error('Error retrieving exercise logs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.post('/exercise-logs/patient/add', authenticate, authorize('admin', 'doctor', 'patient'), async (req, res) => {
  const { patient_exercise_id, log_date, is_completed, note } = req.body;

  if (!patient_exercise_id || !log_date || is_completed === undefined || !note) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const query = `INSERT INTO exercise_logs (patient_exercise_id, log_date, is_completed, note) VALUES ($1, $2, $3, $4) RETURNING *`;

  try {
    const result = await pool.query(query, [patient_exercise_id, log_date, is_completed, note]);
    const newExerciseLog = result.rows[0];

    res.json({
      message: 'Exercise log added successfully',
      exerciseLog: newExerciseLog
    });
  } catch (error) {
    console.error('Error adding exercise log:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.put('/exercise-logs/patient/update', authenticate, authorize('admin', 'doctor', 'patient'), async (req, res) => {
  const { exercise_logs_id, is_completed, note } = req.body;

  if (!exercise_logs_id || is_completed === undefined || !note) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  
  try {
    // First verify the log exists and user has access
    const verifyQuery = `SELECT * FROM exercise_logs WHERE exercise_logs_id = $1`;
    const verifyResult = await pool.query(verifyQuery, [exercise_logs_id]);
    
    if (verifyResult.rows.length === 0) {
      return res.status(404).json({ message: 'Exercise log not found' });
    }

    const log = verifyResult.rows[0];
    
    // Check if user has permission to update this log
    if (req.user.role === 'patient' && req.user.id !== log.patient_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const query = `UPDATE exercise_logs SET is_completed = $1, note = $2 WHERE exercise_logs_id = $3 RETURNING *`;
    const result = await pool.query(query, [is_completed, note, exercise_logs_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Exercise log not found' });
    }

    const updatedExerciseLog = result.rows[0];
    res.json({
      message: 'Exercise log updated successfully',
      exerciseLog: updatedExerciseLog
    });
  } catch (error) {
    console.error('Error updating exercise log:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});









app.listen(PORT, async () => {

  console.log(`Server is running on http://localhost:${PORT}`);
});