const db = require('../db');

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

router.get('/', async (req, res) => {
    //const equipment = await db.getAvailableEquipment();
    const cameras = ['blackmagic', 'gh5'];
    res.render('rentals', { user: req.user, equipmentOptions: cameras});
});



module.exports = router;