const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
require('dotenv').config();
const authRoutes = require('./routes/auth-routes');
const profileRoutes = require('./routes/profile-routes');
const rentalRoutes = require('./routes/rental-routes');
const adminRoutes = require('./routes/admin-routes');
const passportSetup = require('./config/passport-setup');
//const Database = require('./db');
const db = require('./db'); // importing database, not initialized
const passport = require('./config/passport-setup');
//const passport = require('./config/passport-setup'); // Import the passport configuration
//const passportSetup = require('./passport-setup'); 


const app = express();
app.locals.pretty = true;

// Serve static files from the public directory
app.use(express.static('public'));

// use body parsing middleware
app.use(bodyParser.json());

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'pug');

//const db = new Database();

// Initialize the database when the server starts
async function initializeDatabase() {
    try {
        await db.initialize();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error occurred during database initialization:', error);
        process.exit(1); // Exit the process if database initialization fails
    }
}

// Call the function to initialize the database
initializeDatabase();

app.use((req, res, next) => {
    console.log("Adding DB to request");
    req.db = db; // Now db is accessible here
    next();
});



app.use(session({
    secret: process.env.SESSIONSECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000 // 1 day in milliseconds
    }
}));

// initialize passport
app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/rentals', rentalRoutes);
app.use('/admin', adminRoutes);

app.use('/', require('./routes/main'));

app.listen(3000, () => {
    console.log("Server is running on port 3000")
});
