const router = require('express').Router();
const passport = require('passport');

// auth logout
router.get('/logout', (req, res) => {
    //handle with passport
    req.logout((err) => {
        if (err) {
            // handle error
            console.error("Error occurred during logout:", err);
            return next(err);
        }
        // redirect user after logout
        res.redirect('/');
    });
});


// auth with google
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));


// callback route for google to redirect to
router.get('/google/callback', passport.authenticate('google'), (req, res) => {
    // Check if there's a returnTo URL in the session
    const returnTo = req.session.returnTo;
    //console.log("ReturnTo URL:", returnTo);
    //console.log("Session Data after redirect:", req.session);
    if (returnTo) {
        // If returnTo exists, redirect to the stored URL
        res.redirect(returnTo);
    } else {
        // If returnTo doesn't exist, redirect to the default URL (home page in this case)
        res.redirect('/');
    }
});

module.exports = router;