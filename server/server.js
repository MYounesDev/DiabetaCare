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

    res.status(200).json({
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
    res.status(200).json({
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
    res.status(200).json({
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
    res.status(200).json({
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

  if (req.user.role != 'admin' && req.user.role != 'doctor' && req.user.id != userId) {
    return res.status(403).json({ message: 'Access denied' });
  }
  try {
    const query = `SELECT * FROM users WHERE id = $1`;
    const result = await pool.query(query, [userId]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.user.role === 'doctor' && req.user.id != userId && user.role_id != 1) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { password, ...userData } = user;
    res.status(200).json({
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

  if (req.user.role != 'admin' && req.user.role != 'doctor' && req.user.id != userId) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { full_name, email, phone_number, birth_date, gender } = req.body;

  if (!full_name || !email || !phone_number || !birth_date || !gender) {
    return res.status(400).json({ message: 'All fields are required' });
  }


  try {

    const queryTemp = `SELECT * FROM users WHERE id = $1`;
    const resultTemp = await pool.query(queryTemp, [userId]);
    const userTemp = resultTemp.rows[0];

    if (req.user.role === 'doctor' && req.user.id != userId && userTemp.role_id != 1) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const genderQuery = `SELECT id FROM genders WHERE gender_name = $1`;
    const genderResult = await pool.query(genderQuery, [gender]);
    const genderId = genderResult.rows[0].id;

    const query = `UPDATE users SET full_name = $1, email = $2, phone_number = $3, birth_date = $4, gender_id = $5  WHERE id = $6`;
    const result = await pool.query(query, [full_name, email, phone_number, birth_date, genderId, userId]);
    res.status(200).json({
      message: 'User updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
})


app.get('/symptoms-recent', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const query = `SELECT * FROM patient_symptoms`;
    const result = await pool.query(query);
    const symptoms = result.rows;
    res.status(200).json({
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
    res.status(200).json({
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


    res.status(200).json({
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
    res.status(200).json({ message: 'Patient deleted successfully' });
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


    res.status(200).json({
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

    res.status(200).json({
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
    const patientExercises = exercisesResult.rows[0].pending_exercises || 0;

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
        patientExercises,
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



app.get('/symptom_types', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const query = `SELECT * FROM symptom_types`;
  try {
    const result = await pool.query(query);
    const symptomTypes = result.rows;
    res.status(200).json({ symptomTypes });
  } catch (error) {
    console.error('Error retrieving symptom types:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.post('/symptom_types/create', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const { symptom_name, description } = req.body;

  if (!symptom_name || !description) {
    return res.status(400).json({ message: 'Name and description are required' });
  }

  const query = `INSERT INTO symptom_types (symptom_name, description) VALUES ($1, $2) RETURNING *`;
  try {
    const result = await pool.query(query, [symptom_name, description]);
    const newSymptomType = result.rows[0];
    res.status(201).json({ newSymptomType });
  } catch (error) {
    console.error('Error creating symptom type:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.put('/symptom_types/update', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const { symptom_id, symptom_name, description } = req.body;

  if (!symptom_id || !symptom_name || !description) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const query = `UPDATE symptom_types SET symptom_name = $1, description = $2 WHERE symptom_types.symptom_id = $3 RETURNING *`;

  try {
    const result = await pool.query(query, [symptom_name, description, symptom_id]);
    const updatedSymptomType = result.rows[0];
    res.status(200).json({ updatedSymptomType });
  } catch (error) {
    console.error('Error updating symptom type:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.delete('/symptom_types/:symptom_id', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const { symptom_id } = req.params;

  if (!symptom_id) {
    return res.status(400).json({ message: 'Symptom type ID is required' });
  }

  const query = `DELETE FROM symptom_types WHERE symptom_types.symptom_id = $1`;
  try {
    const result = await pool.query(query, [symptom_id]);
    res.status(200).json({ message: 'Symptom type deleted successfully' });
  } catch (error) {
    console.error('Error deleting symptom type:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.get('/symptoms/patient/:patient_id', authenticate, authorize('admin', 'doctor', 'patient'), async (req, res) => {
  const { patient_id } = req.params;

  if (!patient_id) {
    return res.status(400).json({ message: 'Patient ID is required' });
  }

  if (req.user.role_id === 'patient' && req.user.id != patient_id) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const query = `SELECT * FROM patient_symptoms 
  INNER JOIN symptom_types ON patient_symptoms.symptom_id = symptom_types.symptom_id
  WHERE patient_symptoms.patient_id = $1`;
  try {
    const result = await pool.query(query, [patient_id]);
    const symptoms = result.rows;

    res.status(200).json({ symptoms });
  } catch (error) {
    console.error('Error retrieving symptoms:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.post('/symptoms/patient/add', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const { patient_id, symptom_id } = req.body;

  if (!patient_id || !symptom_id) {
    return res.status(400).json({ message: 'Patient ID and symptom ID are required' });
  }

  const query = `INSERT INTO patient_symptoms (patient_id, symptom_id) VALUES ($1, $2) RETURNING *`;
  try {
    const result = await pool.query(query, [patient_id, symptom_id]);
    const newSymptom = result.rows[0];
    res.status(201).json({ newSymptom });
  } catch (error) {
    console.error('Error adding symptom:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



app.delete('/symptoms/patient/delete/:patient_symptoms_id', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const { patient_symptoms_id } = req.params;

  console.log(req.params);
  if (!patient_symptoms_id) {
    return res.status(400).json({ message: 'Patient symptom ID is required' });
  }

  const query = `DELETE FROM patient_symptoms
  WHERE patient_symptoms.patient_symptoms_id = $1`;
  try {
    const result = await pool.query(query, [patient_symptoms_id]);
    res.status(200).json({ message: 'Symptom deleted successfully' });
  } catch (error) {
    console.error('Error deleting symptom:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});




app.get('/blood-sugar-measurements/patient/:patient_id', authenticate, authorize('admin', 'doctor', 'patient'), async (req, res) => {
  const { patient_id } = req.params;

  if (!patient_id) {
    return res.status(400).json({ message: 'Patient ID is required' });
  }

  if (req.user.role_id === 'patient' && req.user.id != patient_id) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const query = `SELECT *
  FROM blood_sugar_measurements
  INNER JOIN blood_sugar_levels ON blood_sugar_measurements.blood_sugar_level_id = blood_sugar_levels.blood_sugar_level_id
  WHERE patient_id = $1`;
  try {
    const result = await pool.query(query, [patient_id]);
    const bloodSugarMeasurements = result.rows;
    console.log(bloodSugarMeasurements);
    res.status(200).json({
      message: 'Blood sugar measurements retrieved successfully',
      bloodSugarMeasurements: bloodSugarMeasurements
    });
  } catch (error) {
    console.error('Error retrieving blood sugar measurements:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});




app.post('/blood-sugar-measurements/patient/add', authenticate, authorize('admin', 'doctor', 'patient'), async (req, res) => {
  const { patient_id, value, measured_at } = req.body;

  if (!patient_id || !value || !measured_at) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (req.user.role_id === 'patient' && req.user.id != patient_id) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const query = `INSERT INTO blood_sugar_measurements (patient_id, value, measured_at) VALUES ($1, $2, $3) RETURNING *`;
  try {
    const result = await pool.query(query, [patient_id, value, measured_at]);
    const newBloodSugarMeasurement = result.rows[0];
    res.status(201).json({ newBloodSugarMeasurement });
  } catch (error) {
    console.error('Error adding blood sugar measurement:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.put('/blood-sugar-measurements/patient/update', authenticate, authorize('admin', 'doctor', 'patient'), async (req, res) => {
  const { blood_sugar_measurement_id, value, measured_at } = req.body;

  if (!blood_sugar_measurement_id || !value || !measured_at) {
    console.log(req.body);
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    if (req.user.role_id === 'patient') {
      const checkQuery = await pool.query(`SELECT * 
  FROM blood_sugar_measurements
  INNER JOIN users ON blood_sugar_measurements.patient_id = users.id
  WHERE blood_sugar_measurement_id = $1`, [blood_sugar_measurement_id]);

      const checkResult = await pool.query(checkQuery, [blood_sugar_measurement_id]);
      const patient_id = checkResult.rows[0].patient_id;


      if (req.user.id != patient_id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const query = `UPDATE blood_sugar_measurements
  SET value = $1, measured_at = $2
  WHERE blood_sugar_measurement_id = $3 RETURNING *`;
    const result = await pool.query(query, [value, measured_at, blood_sugar_measurement_id]);
    const updatedBloodSugarMeasurement = result.rows[0];
    res.status(200).json({ updatedBloodSugarMeasurement });
  } catch (error) {
    console.error('Error updating blood sugar measurement:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.delete('/blood-sugar-measurements/patient/delete/:blood_sugar_measurement_id', authenticate, authorize('admin', 'doctor', 'patient'), async (req, res) => {
  const { blood_sugar_measurement_id } = req.params;

  if (!blood_sugar_measurement_id) {
    return res.status(400).json({ message: 'Blood sugar measurement ID is required' });
  }

  try {
    if (req.user.role_id === 'patient') {
      const checkQuery = await pool.query(`SELECT * 
  FROM blood_sugar_measurements
  INNER JOIN users ON blood_sugar_measurements.patient_id = users.id
  WHERE blood_sugar_measurement_id = $1`, [blood_sugar_measurement_id]);

      const checkResult = await pool.query(checkQuery, [blood_sugar_measurement_id]);
      const patient_id = checkResult.rows[0].patient_id;


      if (req.user.id != patient_id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const query = `DELETE FROM blood_sugar_measurements WHERE blood_sugar_measurement_id = $1`;

    const result = await pool.query(query, [blood_sugar_measurement_id]);
    res.status(200).json({ message: 'Blood sugar measurement deleted successfully' });
  } catch (error) {
    console.error('Error deleting blood sugar measurement:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.get('/blood-sugar-measurements/patient/avg/:patient_id', authenticate, authorize('admin', 'doctor', 'patient'), async (req, res) => {
  const { patient_id } = req.params;

  if (!patient_id) {
    return res.status(400).json({ message: 'Patient ID is required' });
  }

  try {
    const query = `SELECT AVG(value) as average_value FROM blood_sugar_measurements WHERE patient_id = $1`;
    const result = await pool.query(query, [patient_id]);
    const averageValue = result.rows[0].average_value || 0;
    res.status(200).json({ averageValue });
  } catch (error) {
    console.error('Error retrieving average blood sugar value:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



app.get('/exercise-types', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const query = `SELECT * FROM exercise_types`;
    const result = await pool.query(query);
    const exercisePlans = result.rows;

    res.status(200).json({
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

    res.status(201).json({
      message: 'Exercise type created successfully',
      exerciseType: newExerciseType
    });

  } catch (error) {
    console.error('Error creating exercise type:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.post('/exercise-types/update', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const { exercise_id, exercise_name, description } = req.body;

  if (!exercise_id || !exercise_name || !description) {
    console.log(req.body);
    return res.status(400).json({ message: 'ID, name, and description are required' });
  }

  try {
    const query = `UPDATE exercise_types SET exercise_name = $1, description = $2 WHERE exercise_id = $3 RETURNING *`;
    const result = await pool.query(query, [exercise_name, description, exercise_id]);
    const updatedExerciseType = result.rows[0];

    res.status(200).json({
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
    res.status(200).json({ message: 'Exercise type deleted successfully' });
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

    res.status(200).json({
      message: 'Total patient assignments retrieved successfully',
      totalAssignments: totalAssignments
    });
  } catch (error) {
    console.error('Error retrieving total patient assignments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});








app.get('/patient-exercises/patient/:patient_id', authenticate, authorize('admin', 'doctor', 'patient'), async (req, res) => {
  const { patient_id } = req.params;



  if (!patient_id) {
    return res.status(400).json({ message: 'Patient ID is required' });
  }

  if (req.user.role_id === 'patient' && req.user.id != patient_id) {
    return res.status(403).json({ message: 'Access denied' });
  }


  const query = `SELECT * 
  FROM patient_exercises 
  INNER JOIN exercise_types ON patient_exercises.exercise_id = exercise_types.exercise_id
  WHERE patient_exercises.patient_id = $1`;
  try {
    const result = await pool.query(query, [patient_id]);
    const patientExercises = result.rows;
    res.status(200).json({
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

    res.status(201).json({
      message: 'Patient exercise added successfully',
      patientExercise: newPatientExercise
    });
  } catch (error) {
    console.error('Error adding patient exercise:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/patient-exercises/patient/update', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const { patient_exercise_id, patient_id, status, start_date, end_date } = req.body;

  const doctor_id = req.user.id;

  console.log(req.body);
  if (!patient_exercise_id || !patient_id || !doctor_id || !status || !start_date) {
    return res.status(400).json({ message: 'All fields are required' });
  }


  const query = `UPDATE patient_exercises SET patient_id = $1, doctor_id = $2, status = $3, start_date = $4, end_date = $5 WHERE id = $6 RETURNING *`;

  try {
    const result = await pool.query(query, [patient_id, doctor_id, status, start_date, end_date, patient_exercise_id]);
    const updatedPatientExercise = result.rows[0];

    res.status(200).json({
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
    res.status(200).json({ message: 'Patient exercise deleted successfully' });
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
    res.status(200).json({
      message: 'Completed exercises retrieved successfully',
      completedExercises: completedExercises
    });
  } catch (error) {
    console.error('Error retrieving completed exercises:', error);
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
    res.status(200).json({
      message: 'Patient exercises retrieved successfully',
      patientExercises: patientExercises
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
    const patientExercises = result.rows;
    res.status(200).json({
      message: 'Pending exercises retrieved successfully',
      patientExercises: patientExercises
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
    res.status(200).json({
      message: 'Completed exercises retrieved successfully',
      completedExercises: completedExercises
    });
  } catch (error) {
    console.error('Error retrieving completed exercises:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});













app.get('/exercise-logs/patient/:patient_exercise_id', authenticate, authorize('admin', 'doctor', 'patient'), async (req, res) => {
  const { patient_exercise_id } = req.params;

  if (!patient_exercise_id) {
    return res.status(400).json({ message: 'patientexercise ID is required' });
  }

  try {
    const checkRole = await pool.query(`SELECT * 
    FROM patient_exercises 
    INNER JOIN users ON patient_exercises.patient_id = users.id
    WHERE patient_exercises.id = $1`, [patient_exercise_id]);

    const patient_id = checkRole.rows[0].patient_id;

    if (req.user.role_id === 'patient' && req.user.id != patient_id) {
      return res.status(403).json({ message: 'Access denied' });
    }
  } catch (error) {
    console.error('Error checking role:', error);
    res.status(500).json({ message: 'Internal server error checking role' });
  }




  const query = `SELECT *
    FROM exercise_logs 
    INNER JOIN patient_exercises ON exercise_logs.patient_exercise_id = patient_exercises.id
    WHERE exercise_logs.patient_exercise_id = $1 
    ORDER BY log_date DESC`;

  try {



    const result = await pool.query(query, [patient_exercise_id]);
    const exerciseLogs = result.rows;

    res.status(200).json({
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

  console.log('body', req.body);

  if (!patient_exercise_id || !log_date || is_completed === undefined || note == undefined) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const query = `INSERT INTO exercise_logs (patient_exercise_id, log_date, is_completed, note) VALUES ($1, $2, $3, $4) RETURNING *`;

  try {
    const result = await pool.query(query, [patient_exercise_id, log_date, is_completed, note]);
    const newExerciseLog = result.rows[0];

    res.status(201).json({
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

  if (!exercise_logs_id || is_completed === undefined || note == undefined) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  console.log(req.body);
  try {
    // First verify the log exists and user has access
    if (req.user.role === 'patient') {
      const verifyQuery = `SELECT *
    FROM exercise_logs 
    INNER JOIN patient_exercises ON exercise_logs.patient_exercise_id = patient_exercises.id
    INNER JOIN users ON patient_exercises.patient_id = users.id
    WHERE exercise_logs_id = $1`;
      const verifyResult = await pool.query(verifyQuery, [exercise_logs_id]);

      if (verifyResult.rows.length === 0) {
        console.log('Exercise log not found');
        return res.status(404).json({ message: 'Exercise log not found' });
      }

      const log = verifyResult.rows[0];

      // Check if user has permission to update this log
      if (req.user.id != log.patient_id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    const query = `UPDATE exercise_logs SET is_completed = $1, note = $2 WHERE exercise_logs_id = $3 RETURNING *`;
    const result = await pool.query(query, [is_completed, note, exercise_logs_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Exercise log not found' });
    }

    const updatedExerciseLog = result.rows[0];
    res.status(200).json({
      message: 'Exercise log updated successfully',
      exerciseLog: updatedExerciseLog
    });
  } catch (error) {
    console.error('Error updating exercise log:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.delete('/exercise-logs/patient/delete/:exercise_logs_id', authenticate, authorize('admin', 'doctor', 'patient'), async (req, res) => {
  const { exercise_logs_id } = req.params;

  if (!exercise_logs_id) {
    return res.status(400).json({ message: 'Exercise log ID is required' });
  }

  try {

    if (req.user.role === 'patient') {
      const verifyQuery = `SELECT *
    FROM exercise_logs 
    INNER JOIN patient_exercises ON exercise_logs.patient_exercise_id = patient_exercises.id
    INNER JOIN users ON patient_exercises.patient_id = users.id
    WHERE exercise_logs_id = $1`;
      const verifyResult = await pool.query(verifyQuery, [exercise_logs_id]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({ message: 'Exercise log not found' });
      }

      const log = verifyResult.rows[0];

      if (req.user.id != log.patient_id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    const query = `DELETE FROM exercise_logs WHERE exercise_logs_id = $1`;
    const result = await pool.query(query, [exercise_logs_id]);
    res.status(200).json({ message: 'Exercise log deleted successfully' });
  } catch (error) {
    console.error('Error deleting exercise log:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// --- EXERCISE RECOMMENDATION ---
app.get('/exercise-recommendation/:patient_id', authenticate, authorize('admin', 'doctor'), async (req, res) => {

  const { patient_id } = req.params;

  if (!patient_id) {
    return res.status(400).json({ message: 'Patient ID is required' });
  }

  try {

    // Get patient symptoms
    const symptom = await pool.query(`
      SELECT symptom_types.symptom_name 
      FROM patient_symptoms
      INNER JOIN symptom_types ON patient_symptoms.symptom_id = symptom_types.symptom_id
      WHERE patient_symptoms.patient_id = $1
    `, [patient_id]);

    const symptom_names = symptom.rows.map(row => row.symptom_name);

    // Get blood sugar measurements and calculate average
    const blood_sugar_result = await pool.query(`
      SELECT AVG(value) as average_blood_sugar 
      FROM blood_sugar_measurements 
      WHERE patient_id = $1
    `, [patient_id]);

    const average_blood_sugar = blood_sugar_result.rows[0].average_blood_sugar || 0;

    // Find matching recommendation rule
    const recommendedExercises = (await pool.query(`
      SELECT 
        recommendation_rules.exercise_id,
        exercise_types.exercise_name

      FROM recommendation_rules
      
      LEFT JOIN exercise_types ON recommendation_rules.exercise_id = exercise_types.exercise_id
        AND (recommendation_rules.min_blood_sugar IS NULL OR $1 >= recommendation_rules.min_blood_sugar)
        AND (recommendation_rules.max_blood_sugar IS NULL OR $1 < recommendation_rules.max_blood_sugar)
        AND symptoms_match($2::text[], recommendation_rules.required_symptoms)
      LIMIT 1
    `, [average_blood_sugar, symptom_names])).rows;




    res.status(200).json({
      message: 'Exercise recommendation retrieved successfully',
      result_reco: recommendedExercises,
    });

  } catch (error) {
    console.error('Error in exercise recommendation:', error);
    res.status(500).json({
      message: 'Internal server error while generating exercise recommendation'
    });
  }
});








app.get('/diet-types', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const query = `SELECT * FROM diet_types`;
    const result = await pool.query(query);
    const dietPlans = result.rows;

    res.status(200).json({
      message: 'Diet plans retrieved successfully',
      dietPlans: dietPlans
    });

  } catch (error) {
    console.error('Error retrieving diet types:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/diet-types/create', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    return res.status(400).json({ message: 'Name and description are required' });
  }

  try {
    const query = `INSERT INTO diet_types (diet_name, description) VALUES ($1, $2) RETURNING *`;
    const result = await pool.query(query, [name, description]);
    const newDietType = result.rows[0];

    res.status(201).json({
      message: 'Diet type created successfully',
      dietType: newDietType
    });

  } catch (error) {
    console.error('Error creating diet type:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.post('/diet-types/update', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const { diet_id, diet_name, description } = req.body;

  if (!diet_id || !diet_name || !description) {
    return res.status(400).json({ message: 'ID, name, and description are required' });
  }

  try {
    const query = `UPDATE diet_types SET diet_name = $1, description = $2 WHERE diet_id = $3 RETURNING *`;
    const result = await pool.query(query, [diet_name, description, diet_id]);
    const updatedDietType = result.rows[0];

    res.status(200).json({
      message: 'Diet type updated successfully',
      dietType: updatedDietType
    });

  } catch (error) {
    console.error('Error updating diet type:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.delete('/diet-types/:diet_id', authenticate, authorize('admin', 'doctor'), async (req, res) => {

  const { diet_id } = req.params;

  if (!diet_id) {
    return res.status(400).json({ message: 'Diet ID is required' });
  }

  try {
    const query = `DELETE FROM diet_types WHERE diet_id = $1`;
    const result = await pool.query(query, [diet_id]);
    res.status(200).json({ message: 'Diet type deleted successfully' });
  } catch (error) {
    console.error('Error deleting diet type:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.get('/diet-types/:diet_id/sum-patient-assignments', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const { diet_id } = req.params;

  if (!diet_id) {
    return res.status(400).json({ message: 'Diet ID is required' });
  }

  try {
    const query = `SELECT COUNT(*) as total_assignments 
    FROM patient_diets 
    WHERE diet_id = $1`;
    const result = await pool.query(query, [diet_id]);
    const totalAssignments = result.rows[0].total_assignments || 0;

    res.status(200).json({
      message: 'Total patient assignments retrieved successfully',
      totalAssignments: totalAssignments
    });
  } catch (error) {
    console.error('Error retrieving total patient assignments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});








app.get('/patient-diets/patient/:patient_id', authenticate, authorize('admin', 'doctor', 'patient'), async (req, res) => {
  const { patient_id } = req.params;



  if (!patient_id) {
    return res.status(400).json({ message: 'Patient ID is required' });
  }

  if (req.user.role_id === 'patient' && req.user.id != patient_id) {
    return res.status(403).json({ message: 'Access denied' });
  }


  const query = `SELECT * 
  FROM patient_diets 
  INNER JOIN diet_types ON patient_diets.diet_id = diet_types.diet_id
  WHERE patient_diets.patient_id = $1`;
  try {
    const result = await pool.query(query, [patient_id]);
    const patientDiets = result.rows;
    res.status(200).json({
      message: 'Patient diets retrieved successfully',
      patientDiets: patientDiets
    });
  } catch (error) {
    console.error('Error retrieving patient diets:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/patient-diets/patient/add', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const { patient_id, diet_id, status, start_date, end_date } = req.body;

  const doctor_id = req.user.id;


  if (!patient_id || !diet_id || !status || !start_date) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const query = `INSERT INTO patient_diets (patient_id, diet_id, doctor_id, status, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;

  try {
    const result = await pool.query(query, [patient_id, diet_id, doctor_id, status, start_date, end_date]);
    const newPatientDiet = result.rows[0];

    res.status(201).json({
      message: 'Patient diet added successfully',
      patientDiet: newPatientDiet
    });
  } catch (error) {
    console.error('Error adding patient diet:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/patient-diets/patient/update', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const { patient_diet_id, patient_id, diet_id, status, start_date, end_date } = req.body;

  const doctor_id = req.user.id;

  if (!patient_diet_id || !patient_id || !diet_id || !doctor_id || !status || !start_date) {
    return res.status(400).json({ message: 'All fields are required' });
  }


  const query = `UPDATE patient_diets SET patient_id = $1, diet_id = $2, doctor_id = $3, status = $4, start_date = $5, end_date = $6 WHERE id = $7 RETURNING *`;

  try {
    const result = await pool.query(query, [patient_id, diet_id, doctor_id, status, start_date, end_date, patient_diet_id]);
    const updatedPatientDiet = result.rows[0];

    res.status(200).json({
      message: 'Patient diet updated successfully',
      patientDiet: updatedPatientDiet
    });
  } catch (error) {
    console.error('Error updating patient diet:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.delete('/patient-diets/patient/delete/:patient_diet_id', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const { patient_diet_id } = req.params;

  if (!patient_diet_id) {
    return res.status(400).json({ message: 'Patient diet ID is required' });
  }



  const query = `DELETE FROM patient_diets WHERE id = $1`;

  try {
    const result = await pool.query(query, [patient_diet_id]);
    res.status(200).json({ message: 'Patient diet deleted successfully' });
  } catch (error) {
    console.error('Error deleting patient diet:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.get('/patient-diets/patient/completed', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const { patient_id } = req.body;
  const query = `SELECT * FROM patient_diets WHERE patient_id = $1 AND status = 'completed'`;
  if (!patient_id) {
    return res.status(400).json({ message: 'Patient ID is required' });
  }

  try {
    const result = await pool.query(query, [patient_id]);
    const completedDiets = result.rows;
    res.status(200).json({
      message: 'Completed diets retrieved successfully',
      completedDiets: completedDiets
    });
  } catch (error) {
    console.error('Error retrieving completed diets:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



app.get('/patient-diets/patient', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const { patient_id } = req.body;
  const query = `SELECT * FROM patient_diets WHERE patient_id = $1`;
  if (!patient_id) {
    return res.status(400).json({ message: 'Patient ID is required' });
  }

  try {
    const result = await pool.query(query, [patient_id]);
    const patientDiets = result.rows;
    res.status(200).json({
      message: 'Patient diets retrieved successfully',
      patientDiets: patientDiets
    });
  } catch (error) {
    console.error('Error retrieving patient diets:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/patient-diets/pending', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const query = `SELECT * FROM patient_diets WHERE status = 'pending'`;
  try {
    const result = await pool.query(query);
    const patientDiets = result.rows;
    res.status(200).json({
      message: 'Pending diets retrieved successfully',
      patientDiets: patientDiets
    });
  } catch (error) {
    console.error('Error retrieving pending diets:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.get('/patient-diets/completed', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const query = `SELECT * FROM patient_diets WHERE status = 'completed'`;
  try {
    const result = await pool.query(query);
    const completedDiets = result.rows;
    res.status(200).json({
      message: 'Completed diets retrieved successfully',
      completedDiets: completedDiets
    });
  } catch (error) {
    console.error('Error retrieving completed diets:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});













app.get('/diet-logs/patient/:patient_diet_id', authenticate, authorize('admin', 'doctor', 'patient'), async (req, res) => {
  const { patient_diet_id } = req.params;

  if (!patient_diet_id) {
    return res.status(400).json({ message: 'patientdiet ID is required' });
  }

  try {
    const checkRole = await pool.query(`SELECT * 
    FROM patient_diets 
    INNER JOIN users ON patient_diets.patient_id = users.id
    WHERE patient_diets.id = $1`, [patient_diet_id]);

    const patient_id = checkRole.rows[0].patient_id;

    if (req.user.role_id === 'patient' && req.user.id != patient_id) {
      return res.status(403).json({ message: 'Access denied' });
    }
  } catch (error) {
    console.error('Error checking role:', error);
    res.status(500).json({ message: 'Internal server error checking role' });
  }




  const query = `SELECT *
    FROM diet_logs 
    INNER JOIN patient_diets ON diet_logs.patient_diet_id = patient_diets.id
    WHERE diet_logs.patient_diet_id = $1 
    ORDER BY log_date DESC`;

  try {



    const result = await pool.query(query, [patient_diet_id]);
    const dietLogs = result.rows;

    res.status(200).json({
      message: 'Diet logs retrieved successfully',
      dietLogs: dietLogs
    });
  } catch (error) {
    console.error('Error retrieving diet logs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.post('/diet-logs/patient/add', authenticate, authorize('admin', 'doctor', 'patient'), async (req, res) => {
  const { patient_diet_id, log_date, is_completed, note } = req.body;



  if (!patient_diet_id || !log_date || is_completed === undefined || note == undefined) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const query = `INSERT INTO diet_logs (patient_diet_id, log_date, is_completed, note) VALUES ($1, $2, $3, $4) RETURNING *`;

  try {
    const result = await pool.query(query, [patient_diet_id, log_date, is_completed, note]);
    const newDietLog = result.rows[0];

    res.status(201).json({
      message: 'Diet log added successfully',
      dietLog: newDietLog
    });
  } catch (error) {
    console.error('Error adding diet log:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.put('/diet-logs/patient/update', authenticate, authorize('admin', 'doctor', 'patient'), async (req, res) => {
  const { diet_logs_id, is_completed, note } = req.body;

  if (!diet_logs_id || is_completed === undefined || note == undefined) {
    return res.status(400).json({ message: 'All fields are required' });
  }


  try {
    // First verify the log exists and user has access
    if (req.user.role === 'patient') {
      const verifyQuery = `SELECT *
    FROM diet_logs 
    INNER JOIN patient_diets ON diet_logs.patient_diet_id = patient_diets.id
    INNER JOIN users ON patient_diets.patient_id = users.id
    WHERE diet_logs_id = $1`;
      const verifyResult = await pool.query(verifyQuery, [diet_logs_id]);

      if (verifyResult.rows.length === 0) {
        console.log('Diet log not found');
        return res.status(404).json({ message: 'Diet log not found' });
      }

      const log = verifyResult.rows[0];

      // Check if user has permission to update this log
      if (req.user.id != log.patient_id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    const query = `UPDATE diet_logs SET is_completed = $1, note = $2 WHERE diet_logs_id = $3 RETURNING *`;
    const result = await pool.query(query, [is_completed, note, diet_logs_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Diet log not found' });
    }

    const updatedDietLog = result.rows[0];
    res.status(200).json({
      message: 'Diet log updated successfully',
      dietLog: updatedDietLog
    });
  } catch (error) {
    console.error('Error updating diet log:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.delete('/diet-logs/patient/delete/:diet_logs_id', authenticate, authorize('admin', 'doctor', 'patient'), async (req, res) => {
  const { diet_logs_id } = req.params;

  console.log("diet_logs_id", diet_logs_id);
  if (!diet_logs_id) {
    return res.status(400).json({ message: 'Diet log ID is required' });
  }

  try {

    if (req.user.role === 'patient') {
      const verifyQuery = `SELECT *
    FROM diet_logs 
    INNER JOIN patient_diets ON diet_logs.patient_diet_id = patient_diets.id
    INNER JOIN users ON patient_diets.patient_id = users.id
    WHERE diet_logs_id = $1`;
      const verifyResult = await pool.query(verifyQuery, [diet_logs_id]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({ message: 'Diet log not found' });
      }

      const log = verifyResult.rows[0];

      if (req.user.id != log.patient_id) {
        console.log("sss", log.patient_id);
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    const result = await pool.query('DELETE FROM diet_logs WHERE diet_logs_id = $1', [diet_logs_id]);
    res.status(200).json({ message: 'Diet log deleted successfully' });
  } catch (error) {
    console.error('Error deleting diet log:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// --- DIET RECOMMENDATION ---
app.get('/diet-recommendation/:patient_id', authenticate, authorize('admin', 'doctor'), async (req, res) => {

  const { patient_id } = req.params;

  if (!patient_id) {
    return res.status(400).json({ message: 'Patient ID is required' });
  }

  try {

    // Get patient symptoms
    const symptom = await pool.query(`
      SELECT symptom_types.symptom_name 
      FROM patient_symptoms
      INNER JOIN symptom_types ON patient_symptoms.symptom_id = symptom_types.symptom_id
      WHERE patient_symptoms.patient_id = $1
    `, [patient_id]);

    const symptom_names = symptom.rows.map(row => row.symptom_name);

    // Get blood sugar measurements and calculate average
    const blood_sugar_result = await pool.query(`
      SELECT AVG(value) as average_blood_sugar 
      FROM blood_sugar_measurements 
      WHERE patient_id = $1
    `, [patient_id]);

    const average_blood_sugar = blood_sugar_result.rows[0].average_blood_sugar || 0;

    // Find matching recommendation rule
    const recommendedDiets = (await pool.query(`
      SELECT 
        recommendation_rules.diet_id,
        diet_types.diet_name

      FROM recommendation_rules
      
      LEFT JOIN diet_types ON recommendation_rules.diet_id = diet_types.diet_id
        AND (recommendation_rules.min_blood_sugar IS NULL OR $1 >= recommendation_rules.min_blood_sugar)
        AND (recommendation_rules.max_blood_sugar IS NULL OR $1 < recommendation_rules.max_blood_sugar)
        AND symptoms_match($2::text[], recommendation_rules.required_symptoms)
      LIMIT 1
    `, [average_blood_sugar, symptom_names])).rows;




    res.status(200).json({
      message: 'Diet recommendation retrieved successfully',
      result_reco: recommendedDiets,
    });

  } catch (error) {
    console.error('Error in diet recommendation:', error);
    res.status(500).json({
      message: 'Internal server error while generating diet recommendation'
    });
  }
});



app.get('/insulin-recommendation', authenticate, authorize('admin', 'doctor', 'patient'), async (req, res) => {
  const query = `SELECT 
            insulin_recommendations_id, 
            min_blood_sugar,
            max_blood_sugar,
            level_description,
            insulin_dosage_ml,
            note
          FROM insulin_recommendations`;
  try {
    const result = await pool.query(query);
    res.status(200).json({
      message: 'Insulin recommendation retrieved successfully',
      insulinRecommendations: result.rows
    });
  } catch (error) {
    console.error('Error retrieving insulin recommendation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.post('/insulin-recommendation/create', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const { min_blood_sugar, max_blood_sugar, level_description, insulin_dosage_ml, note } = req.body;

  if (!min_blood_sugar || !max_blood_sugar || !level_description || insulin_dosage_ml == undefined || note == undefined) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const query = `INSERT INTO insulin_recommendations (min_blood_sugar, max_blood_sugar, level_description, insulin_dosage_ml, note) VALUES ($1, $2, $3, $4, $5)`;
  
  try{
  const result = await pool.query(query, [min_blood_sugar, max_blood_sugar, level_description, insulin_dosage_ml, note]);
  res.status(201).json({
    message: 'Insulin recommendation added successfully',
    insulinRecommendation: result.rows[0]
  });
  } catch (error) {
    console.error('Error adding insulin recommendation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



app.put('/insulin-recommendation/update', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const { insulin_recommendations_id, min_blood_sugar, max_blood_sugar, level_description, insulin_dosage_ml, note } = req.body;


  if (!insulin_recommendations_id || !min_blood_sugar || !max_blood_sugar || !level_description || insulin_dosage_ml == undefined || note == undefined) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const query = `UPDATE insulin_recommendations SET min_blood_sugar = $1, max_blood_sugar = $2, level_description = $3, insulin_dosage_ml = $4, note = $5 WHERE insulin_recommendations_id = $6`;
  try{
    const result = await pool.query(query, [min_blood_sugar, max_blood_sugar, level_description, insulin_dosage_ml, note, insulin_recommendations_id]);
    res.status(200).json({
      message: 'Insulin recommendation updated successfully',
      insulinRecommendation: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating insulin recommendation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



app.delete('/insulin-recommendation/delete/:insulin_recommendations_id', authenticate, authorize('admin', 'doctor'), async (req, res) => {
  const { insulin_recommendations_id } = req.params;
  if (!insulin_recommendations_id) {
    return res.status(400).json({ message: 'Insulin recommendation ID is required' });
  }
  try{
    const result = await pool.query('DELETE FROM insulin_recommendations WHERE insulin_recommendations_id = $1', [insulin_recommendations_id]);
    res.status(200).json({ message: 'Insulin recommendation deleted successfully' });
  } catch (error) {
    console.error('Error deleting insulin recommendation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



app.get('/insulin-recommendation/patient/', authenticate, authorize('admin', 'doctor', 'patient'), async (req, res) => {
  const { patient_id, datetime } = req.query;
  
  if (!patient_id || !datetime) {
    return res.status(400).json({ message: 'Patient ID and time are required' });
  }
  
  if (req.user.role === 'patient' && req.user.id != patient_id) {
      return res.status(403).json({ message: 'Access denied' });
  }
  
  // Calculate the patient's average blood sugar from 6:00 AM of the same day up to the given datetime
  const startOfRange = new Date(datetime);
  startOfRange.setHours(6, 0, 0, 0); // 6:00:00.000 AM
  
  console.log("startOfRange", startOfRange);
  console.log("datetime", datetime);

  try{
  const bloodSugarRecords = await pool.query(`
    SELECT
        AVG(value) as average_blood_sugar,
        COUNT(*) as total_records
      FROM blood_sugar_measurements 
    WHERE patient_id = $1 AND measured_at >= $2 AND measured_at <= $3
  `, [patient_id, startOfRange, datetime]);

  console.log("rows = ", bloodSugarRecords.rows);

  // calculate the average of the blood_sugar_result
  const averageBloodSugar = bloodSugarRecords.rows[0].average_blood_sugar || 0;
  const totalRecords = bloodSugarRecords.rows[0].total_records || 0;
  console.log("averageBloodSugar", averageBloodSugar);
  console.log("averageBloodSugar", parseInt(averageBloodSugar));
  // check the insulin recommendation to find the correct recommendation that matches the average blood sugar
  const recommendedInsulinResult = averageBloodSugar ? await pool.query(`
    SELECT
        insulin_dosage_ml,
        level_description,
        note
    FROM insulin_recommendations 
    WHERE min_blood_sugar <= $1 AND max_blood_sugar >= $1
  `, [parseInt(averageBloodSugar)]) : null;

  const recommendedInsulin = recommendedInsulinResult ? recommendedInsulinResult.rows[0] : null;

  const canTrustResult = totalRecords >= (new Date(datetime)).getHours()/5;

  res.status(200).json({
    message: 'Insulin recommendation retrieved successfully',
    recommendedInsulin: recommendedInsulin,
    totalRecords: totalRecords,
    canTrustResult:  canTrustResult, 
    neededRecords: !canTrustResult ?  Math.ceil((new Date(datetime)).getHours()/5 - totalRecords) : 0
  });
  } catch (error) {
    console.error('Error retrieving insulin recommendation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});







app.get('/insulin-patient-logs/:patient_id', authenticate, authorize('admin', 'doctor', 'patient'), async (req, res) => {
  const { patient_id } = req.params;
  if (req.user.role === 'patient' && req.user.id != patient_id) {
    console.log("patient_id", patient_id);
    console.log("req.user.id", req.user.id);
    return res.status(403).json({ message: 'Access denied' });
  }

  if (!patient_id) {
    return res.status(400).json({ message: 'Patient ID is required' });
  }
  try{
    const result = await pool.query(`
      SELECT
        insulin_log_id, 
        patient_id, 
        log_date, 
        insulin_dosage_ml, 
        note 
      FROM insulin_logs 
      WHERE patient_id = $1
    `, [patient_id]);
    res.status(200).json({
      message: 'Insulin recommendation retrieved successfully',
      patientInsulinLogs: result.rows
    });
  } catch (error) {
    console.error('Error retrieving patient insulin logs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



app.post('/insulin-patient-logs/add', authenticate, authorize('admin', 'doctor', 'patient'), async (req, res) => {
  const { patient_id, log_date, insulin_dosage_ml , note } = req.body;

  if (!patient_id || !log_date || insulin_dosage_ml == undefined || note == undefined) {
    console.log("req.body", req.body);
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (req.user.role === 'patient' && req.user.id != patient_id) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const query = `INSERT INTO insulin_logs (patient_id, log_date, insulin_dosage_ml, note) VALUES ($1, $2, $3, $4)`;

  try{
    const result = await pool.query(query, [patient_id, log_date, insulin_dosage_ml, note]);
    res.status(201).json({
      message: 'Insulin log added successfully',
      insulinLog: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding insulin log:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.put('/insulin-patient-logs/update', authenticate, authorize('admin', 'doctor', 'patient'), async (req, res) => {
  const { insulin_log_id, insulin_dosage_ml, note } = req.body;

  if (!insulin_log_id || insulin_dosage_ml == undefined || note == undefined) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (req.user.role === 'patient' && req.user.id != patient_id) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const query = `UPDATE insulin_logs SET insulin_dosage_ml = $1, note = $2 WHERE insulin_log_id = $3`;
  try{
    const result = await pool.query(query, [insulin_dosage_ml, note, insulin_log_id]);
    
    res.status(200).json({
      message: 'Insulin log updated successfully',
      insulinLog: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating insulin log:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.delete('/insulin-patient-logs/delete/:insulin_log_id', authenticate, authorize('admin', 'doctor', 'patient'), async (req, res) => {
  const { insulin_log_id } = req.params;
  if (!insulin_log_id) {
    return res.status(400).json({ message: 'Insulin log ID is required' });
  }


  try{
    const result = await pool.query('DELETE FROM insulin_logs WHERE insulin_log_id = $1', [insulin_log_id]);
    res.status(200).json({ message: 'Insulin log deleted successfully' });
  } catch (error) {
    console.error('Error deleting insulin log:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});










app.get('/patient/dashboard/stats', authenticate, authorize('patient'), async (req, res) => {
  try {
    const patient_id = req.user.id;

    // Get assigned exercises count
    const exercisesQuery = `
      SELECT 
        COUNT(*) as total_exercises,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_exercises
      FROM patient_exercises 
      WHERE patient_id = $1`;
    const exercisesResult = await pool.query(exercisesQuery, [patient_id]);
    const totalExercises = exercisesResult.rows[0].total_exercises || 0;
    const completedExercises = exercisesResult.rows[0].completed_exercises || 0;
    const exerciseCompletionRate = totalExercises > 0
      ? Math.round((completedExercises / totalExercises) * 100)
      : 0;

    // Get assigned diet plans count
    const dietsQuery = `
      SELECT COUNT(*) as total_diets 
      FROM patient_diets 
      WHERE patient_id = $1`;
    const dietsResult = await pool.query(dietsQuery, [patient_id]);
    const totalDiets = dietsResult.rows[0].total_diets || 0;

    // Get recent blood sugar measurements (last 7 days)
    const bloodSugarQuery = `
      SELECT COUNT(*) as recent_measurements 
      FROM blood_sugar_measurements 
      WHERE patient_id = $1 
      AND measured_at > NOW() - INTERVAL '7 days'`;
    const bloodSugarResult = await pool.query(bloodSugarQuery, [patient_id]);
    const recentBloodSugarMeasurements = bloodSugarResult.rows[0].recent_measurements || 0;

    // Get recent symptoms (last 7 days)
    const symptomsQuery = `
      SELECT COUNT(*) as recent_symptoms 
      FROM patient_symptoms 
      WHERE patient_id = $1 
      AND created_at > NOW() - INTERVAL '7 days'`;
    const symptomsResult = await pool.query(symptomsQuery, [patient_id]);
    const recentSymptoms = symptomsResult.rows[0].recent_symptoms || 0;

    res.json({
      stats: {
        totalExercises,
        completedExercises,
        exerciseCompletionRate,
        totalDiets,
        recentBloodSugarMeasurements,
        recentSymptoms
      }
    });

  } catch (error) {
    console.error('Error retrieving patient dashboard stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});





app.get('/patient/doctor', authenticate, authorize('patient'), async (req, res) => {
  const patient_id = req.user.id;
  // Get assigned doctor
  const doctorQuery = `
    SELECT 
      users.id as doctor_id,
      users.full_name as doctor_name,
      users.email as doctor_email,
      users.phone_number as doctor_phone,
      users.profile_picture as doctor_image
    FROM patient_doctor
    INNER JOIN users ON patient_doctor.doctor_id = users.id
    WHERE patient_doctor.patient_id = $1`;

  try {

    const doctorResult = await pool.query(doctorQuery, [patient_id]);
    const doctor = doctorResult.rows[0];

    res.status(200).json({
      message: 'Doctor retrieved successfully',
      doctor: doctor
    });
  } catch (error) {
    console.error('Error retrieving doctor:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/patient/graph-data/:patient_id', authenticate, authorize('admin', 'doctor', 'patient'), async (req, res) => {
  const { patient_id } = req.params;
  let { start_date, end_date } = req.query;

  if (!patient_id) {
    return res.status(400).json({ message: 'Patient ID is required' });
  }

  if (req.user.role === 'patient' && req.user.id != patient_id) {
    return res.status(403).json({ message: 'Access denied' });
  }

  // Default to last 30 days if no dates provided
  const endDate = end_date ? new Date(end_date) : new Date();
  const startDate = start_date ? new Date(start_date) : new Date(endDate);
  if (!start_date) {
    startDate.setDate(startDate.getDate() - 30);
  }

  try {
    // Get blood sugar measurements with time of day categorization
    const bloodSugarQuery = `
      SELECT 
        bsm.blood_sugar_measurement_id,
        bsm.value as blood_sugar_value,
        bsm.measured_at,
        bsl.label as blood_sugar_level,
        EXTRACT(HOUR FROM bsm.measured_at) as hour_of_day,
        CASE
          WHEN EXTRACT(HOUR FROM bsm.measured_at) BETWEEN 5 AND 11 THEN 'morning'
          WHEN EXTRACT(HOUR FROM bsm.measured_at) BETWEEN 12 AND 17 THEN 'afternoon'
          WHEN EXTRACT(HOUR FROM bsm.measured_at) BETWEEN 18 AND 22 THEN 'evening'
          ELSE 'night'
        END as time_of_day
      FROM blood_sugar_measurements bsm
      LEFT JOIN blood_sugar_levels bsl ON bsm.blood_sugar_level_id = bsl.blood_sugar_level_id
      WHERE bsm.patient_id = $1
        AND bsm.measured_at >= $2
        AND bsm.measured_at <= $3
      ORDER BY bsm.measured_at ASC
    `;

    // Get diet information with completion status
    const dietQuery = `
      SELECT 
        pd.id as patient_diet_id,
        dt.diet_name,
        dt.diet_id,
        pd.start_date,
        pd.end_date,
        dl.log_date,
        dl.is_completed as diet_completed,
        dl.note as diet_notes
      FROM patient_diets pd
      JOIN diet_types dt ON pd.diet_id = dt.diet_id
      LEFT JOIN diet_logs dl ON pd.id = dl.patient_diet_id
      WHERE pd.patient_id = $1
        AND (
          (pd.start_date >= $2 AND pd.start_date <= $3)
          OR (dl.log_date >= $2 AND dl.log_date <= $3)
        )
      ORDER BY pd.start_date ASC
    `;

    // Get exercise information with intensity and duration
    const exerciseQuery = `
      SELECT 
        pe.id as patient_exercise_id,
        et.exercise_name,
        pe.start_date,
        pe.end_date,
        el.log_date,
        el.is_completed as exercise_completed,
        el.note as exercise_notes
      FROM patient_exercises pe
      JOIN exercise_types et ON pe.exercise_id = et.exercise_id
      LEFT JOIN exercise_logs el ON pe.id = el.patient_exercise_id
      WHERE pe.patient_id = $1
        AND (
          (pe.start_date >= $2 AND pe.start_date <= $3)
          OR (el.log_date >= $2 AND el.log_date <= $3)
        )
      ORDER BY pe.start_date ASC
    `;

    // Get insulin logs with categorization
    const insulinQuery = `
      SELECT 
        insulin_log_id,
        log_date,
        insulin_dosage_ml,
        note,
        EXTRACT(HOUR FROM log_date) as hour_of_day,
        CASE
          WHEN EXTRACT(HOUR FROM log_date) BETWEEN 5 AND 11 THEN 'morning'
          WHEN EXTRACT(HOUR FROM log_date) BETWEEN 12 AND 17 THEN 'afternoon'
          WHEN EXTRACT(HOUR FROM log_date) BETWEEN 18 AND 22 THEN 'evening'
          ELSE 'night'
        END as time_of_day
      FROM insulin_logs
      WHERE patient_id = $1
        AND log_date >= $2
        AND log_date <= $3
      ORDER BY log_date ASC
    `;

    // Execute all queries in parallel
    const [bloodSugarResults, dietResults, exerciseResults, insulinResults] = await Promise.all([
      pool.query(bloodSugarQuery, [patient_id, startDate, endDate]),
      pool.query(dietQuery, [patient_id, startDate, endDate]),
      pool.query(exerciseQuery, [patient_id, startDate, endDate]),
      pool.query(insulinQuery, [patient_id, startDate, endDate])
    ]);

    // Process blood sugar data with time-based aggregation
    const bloodSugarByTime = {
      morning: [],
      afternoon: [],
      evening: [],
      night: []
    };

    bloodSugarResults.rows.forEach(row => {
      bloodSugarByTime[row.time_of_day].push({
        id: row.blood_sugar_measurement_id,
        value: parseFloat(row.blood_sugar_value),
        timestamp: row.measured_at,
        level: row.blood_sugar_level,
        hourOfDay: row.hour_of_day
      });
    });

    // Calculate average blood sugar by time of day
    const averageBloodSugarByTime = {};
    Object.keys(bloodSugarByTime).forEach(timeOfDay => {
      const values = bloodSugarByTime[timeOfDay].map(bs => bs.value);
      averageBloodSugarByTime[timeOfDay] = values.length > 0
        ? values.reduce((a, b) => a + b) / values.length
        : 0;
    });

    // Process and structure the data
    const graphData = {
      bloodSugar: {
        measurements: bloodSugarResults.rows.map(row => ({
          id: row.blood_sugar_measurement_id,
          value: parseFloat(row.blood_sugar_value),
          timestamp: row.measured_at,
          level: row.blood_sugar_level,
          timeOfDay: row.time_of_day
        })),
        averagesByTime: averageBloodSugarByTime
      },
      diets: dietResults.rows.map(row => ({
        id: row.patient_diet_id,
        name: row.diet_name,
        type: row.diet_type,
        startDate: row.start_date,
        endDate: row.end_date,
        logDate: row.log_date,
        completed: row.diet_completed,
        notes: row.diet_notes
      })),
      exercises: exerciseResults.rows.map(row => ({
        id: row.patient_exercise_id,
        name: row.exercise_name,
        intensity: row.intensity_level,
        startDate: row.start_date,
        endDate: row.end_date,
        logDate: row.log_date,
        durationMinutes: row.duration_minutes,
        completed: row.exercise_completed,
        notes: row.exercise_notes
      })),
      insulin: {
        measurements: insulinResults.rows.map(row => ({
          id: row.insulin_log_id,
          value: parseFloat(row.insulin_dosage_ml),
          timestamp: row.log_date,
          note: row.note,
          timeOfDay: row.time_of_day
        })),
        averagesByTime: {
          morning: insulinResults.rows.filter(r => r.time_of_day === 'morning').reduce((acc, curr) => acc + parseFloat(curr.insulin_dosage_ml), 0) / (insulinResults.rows.filter(r => r.time_of_day === 'morning').length || 1),
          afternoon: insulinResults.rows.filter(r => r.time_of_day === 'afternoon').reduce((acc, curr) => acc + parseFloat(curr.insulin_dosage_ml), 0) / (insulinResults.rows.filter(r => r.time_of_day === 'afternoon').length || 1),
          evening: insulinResults.rows.filter(r => r.time_of_day === 'evening').reduce((acc, curr) => acc + parseFloat(curr.insulin_dosage_ml), 0) / (insulinResults.rows.filter(r => r.time_of_day === 'evening').length || 1),
          night: insulinResults.rows.filter(r => r.time_of_day === 'night').reduce((acc, curr) => acc + parseFloat(curr.insulin_dosage_ml), 0) / (insulinResults.rows.filter(r => r.time_of_day === 'night').length || 1)
        }
      }
    };

    // Calculate enhanced statistics
    const bloodSugarValues = graphData.bloodSugar.measurements.map(bs => bs.value);
    const insulinValues = graphData.insulin.measurements.map(i => i.value);
    
    const statistics = {
      bloodSugar: {
        average: bloodSugarValues.length > 0 
          ? bloodSugarValues.reduce((a, b) => a + b) / bloodSugarValues.length 
          : 0,
        max: Math.max(...(bloodSugarValues.length > 0 ? bloodSugarValues : [0])),
        min: Math.min(...(bloodSugarValues.length > 0 ? bloodSugarValues : [0])),
        averagesByTime: averageBloodSugarByTime,
        totalMeasurements: bloodSugarValues.length,
        abnormalReadings: bloodSugarValues.filter(v => v < 70 || v > 180).length
      },
      diets: {
        total: new Set(graphData.diets.map(d => d.id)).size,
        completed: graphData.diets.filter(d => d.completed).length,
        adherenceRate: graphData.diets.length > 0
          ? (graphData.diets.filter(d => d.completed).length / graphData.diets.length) * 100
          : 0
      },
      exercises: {
        total: new Set(graphData.exercises.map(e => e.id)).size,
        completed: graphData.exercises.filter(e => e.completed).length,
        adherenceRate: graphData.exercises.length > 0
          ? (graphData.exercises.filter(e => e.completed).length / graphData.exercises.length) * 100
          : 0,
        averageDuration: graphData.exercises
          .filter(e => e.durationMinutes)
          .reduce((acc, curr) => acc + curr.durationMinutes, 0) / (graphData.exercises.filter(e => e.durationMinutes).length || 1)
      },
      insulin: {
        average: insulinValues.length > 0
          ? insulinValues.reduce((a, b) => a + b) / insulinValues.length
          : 0,
        totalDoses: insulinValues.length,
        averagesByTime: graphData.insulin.averagesByTime
      }
    };

    res.status(200).json({
      message: 'Graph data retrieved successfully',
      data: graphData,
      statistics: statistics
    });

  } catch (error) {
    console.error('Error retrieving graph data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(PORT, async () => {

  console.log(`Server is running on http://localhost:${PORT}`);
});