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

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});



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
  const { username, email, phoneNumber, fullName, birthDate, gender, role } = req.body;

  if (!username || !email || !phoneNumber || !fullName || !birthDate || !gender || !role) {
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
      phoneNumber, 
      roleId, 
      hashedPassword, 
      fullName, 
      genderId, 
      birthDate
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
      fullName: fullName,
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
    users.full_name, 
    users.email, 
    users.phone_number, 
    users.birth_date, 
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


app.get('/patients', authenticate, authorize('admin', 'doctor'),async (req, res) => {
  try {
    const query = `SELECT * FROM users WHERE role_id = '1'`;
    const result = await pool.query(query);
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









app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});