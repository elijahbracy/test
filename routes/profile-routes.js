const router = require('express').Router();
const db = require('../db')

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

router.get('/rentals', authCheck, async (req, res) => {
    try {
        // Get rentals for the user
        const rentals = await db.getRentalsByUser(req.user.user_id);
        
        // Fetch equipment for each rental
        const rentalsWithEquipment = await Promise.all(rentals.map(async (rental) => {
            const equipment = await db.getEquipmentByRental(rental.rental_id);
            return { ...rental, equipment };
        }));
        console.log(rentalsWithEquipment);
        // Pass combined data to the template
        res.render('myRentals', { user: req.user, rentals: rentalsWithEquipment });
    } catch (error) {
        console.error('Error retrieving rentals and equipment:', error);
        res.status(500).send('Internal Server Error');
    }
});


module.exports = router;