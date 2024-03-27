const router = require('express').Router();

// middleware function to check if the user is authenticated
const authCheck = (req, res, next) => {
    if (!req.user) {
        // Send a 401 status code along with a message indicating authentication is required
        return res.status(401).send({
            error: 'Authentication required',
            message: 'Please sign in to access this resource.'
        });
    } else {
        next(); // Proceed to the next middleware or route handler
    }
};


router.get('/', authCheck, (req, res) => {
    res.render('profile', {user: req.user});
});

module.exports = router;