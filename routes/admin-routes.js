const db = require('../db');

const router = require('express').Router();

// Middleware function to check if the user is authenticated and an admin
const adminCheck = (req, res, next) => {
    if (!req.user) {
        // Send a 401 status code along with a message indicating authentication is required
        return res.status(401).send({
            error: 'Authentication required',
            message: 'Please sign in to access this resource.'
        });
    }
    
    if (!req.user.isAdmin) {
        // Send a 401 status code along with a message indicating authentication is required
        return res.status(401).send({
            error: 'Authorization required',
            message: 'Please contact an admin for access.'
        });
    }
    
    // User is authenticated and is an admin, proceed to the next middleware
    next();
};


router.get('/', adminCheck, (req, res) => {
    //console.log('admin dashboard', req.user);
    res.render('dashboard', {user: req.user});
});


router.get('/users', adminCheck, async (req,res) => {
    try {
        const users = await db.getAllUsers();

        res.render('users', {user: req.user, users});
    } catch (err) {
        console.error('error fetching users:', err);
        res.status(500).send('Interal Server Error');
    }
});

router.post('/users/make-admin', adminCheck, async (req, res) => {
    const userId = req.body.userId; // Assuming the user ID is sent in the request body
    console.log('userId', userId);
    try {
        // Update user's status to be an admin in the database
        await db.makeUserAdmin(userId);

        // Redirect the user back to the users list page or respond with a success message
        res.redirect('/admin/users');
    } catch (error) {
        // Handle errors appropriately (e.g., show an error message)
        console.error('Error making user admin:', error);
        res.status(500).send('An error occurred while making the user admin.');
    }
});

//router.get('/equipment', adminCheck, ())

module.exports = router;