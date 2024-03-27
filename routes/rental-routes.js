const router = require('express').Router();

// middleware function to check if the user is authenticated
const authCheck = (req, res, next) => {
    if (!req.user) {
        res.redirect('/');
    }
    else {
        next();
    }
};

router.get('/', (req, res) => {
    res.render('rentals', { user: req.user, equipmentOptions: [] });
});



module.exports = router;