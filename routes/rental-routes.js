const db = require('../db');
const knex = require('../config/knexfile');
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
    try {
        // Query the database to get available equipment
        const availableEquipment = await knex('Equipment')
            .leftJoin('Availability', 'Equipment.equipment_id', 'Availability.equipment_id')
            .whereNotNull('Availability.available_quantity') // Filter out equipment with no availability
            .select('Equipment.equipment_id', 'Equipment.name');

        res.render('rentals', { user: req.user, equipmentOptions: availableEquipment });
    } catch (error) {
        console.error('Error fetching available equipment:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Handle POST request to '/rentals'
router.post('/', async (req, res) => {
    try {
        // Extract data from the request body
        const { firstName, lastName, email, equipment, startDate, endDate, notes } = req.body;

        // Log the form data
        console.log('First Name:', firstName);
        console.log('Last Name:', lastName);
        console.log('Email:', email);
        console.log('Selected Equipment:', equipment);
        console.log('Start Date:', startDate);
        console.log('End Date:', endDate);
        console.log('Additional Notes:', notes);

        // Insert rental information into the rental table
        //const rentalId = await db.insertRental(firstName, lastName, email, startDate, endDate, notes);

        // Insert rental equipment information into the rentalEquipment table
        console.log(req.body.equipment);
        for (const equipmentId of equipment) {
            console.log('Inserting equipment:', equipmentId);
           //await db.insertRentalEquipment(rentalId, equipmentId);
        }

        // Redirect to a success page or return a success response
        //res.redirect('/rentalSuccess');
    } catch (error) {
        console.error('Error submitting rental:', error);
        res.status(500).send('Internal Server Error');
    }
});




module.exports = router;