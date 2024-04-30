const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
require('dotenv').config();
const authRoutes = require('./routes/auth-routes');
const profileRoutes = require('./routes/profile-routes');
const rentalRoutes = require('./routes/rental-routes');
const adminRoutes = require('./routes/admin-routes');
const publicRoutes = require('./routes/public-routes');
const aboutRoutes = require('./routes/about-routes');
const constructionRoute = require('./routes/underConstruction');

const passportSetup = require('./config/passport-setup');
//const Database = require('./db');
const db = require('./db'); // importing database
const passport = require('./config/passport-setup');
//const passport = require('./config/passport-setup'); // Import the passport configuration
//const passportSetup = require('./passport-setup'); 

// Require for sendgrid
const sgMail = require('@sendgrid/mail');

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const cron = require('node-cron');


const app = express();
app.locals.pretty = true;

// Serve static files from the public directory
app.use(express.static('public'));

// use body parsing middleware
app.use(bodyParser.json());

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'pug');

//const db = new Database();

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
app.use('/api', publicRoutes);
app.use('/about', aboutRoutes);

app.use('/unfinished', constructionRoute);

app.use('/', require('./routes/main'));


// scheduled tasks
//const reminderEmailTask = require('./scheduledTasks/reminderEmail');


// Use the PORT environment variable if available, otherwise use port 3000
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});