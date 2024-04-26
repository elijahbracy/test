const db = require('../db');
const knex = require('../config/knexfile');
const router = require('express').Router();
const sgMail = require('@sendgrid/mail');

// admin-routes.js

// Define formatDate function
function formatDate(dateString) {
    if (!dateString) return ''; // Return empty string if dateString is not provided
    const date = new Date(dateString);
    const year = date.getFullYear();
    let month = (date.getMonth() + 1).toString();
    let day = date.getDate().toString();
    if (month.length === 1) month = '0' + month; // Add leading zero if month is single digit
    if (day.length === 1) day = '0' + day; // Add leading zero if day is single digit
    return `${year}-${month}-${day}`;
}


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
router.post('/', authCheck, async (req, res) => {
    try {
        // Extract data from the request body
        const { firstName, lastName, email, equipment, startDate, endDate, notes, course } = req.body;

        const user = await db.getUserByEmail(email);
        console.log("user:", user);

        // change dates to proper format
        const startDateFinal = formatDate(startDate);
        const endDateFinal = formatDate(endDate);

        // Log the form data
        console.log('First Name:', firstName);
        console.log('Last Name:', lastName);
        console.log('Email:', email);
        console.log('Selected Equipment:', equipment);
        console.log('Start Date:', startDate);
        console.log('End Date:', endDate);
        console.log('Course: ', course);
        console.log('Additional Notes:', notes);
        console.log('start date final:', startDateFinal);
        console.log('end date final:', endDateFinal);


        // Insert rental information into the rental table
        const result = await db.insertRental(user.user_id, startDate, endDate, notes, course);

        // Insert rental equipment information into the rentalEquipment table
        console.log(req.body.equipment);
        for (const equipmentId of equipment) {
            console.log('Inserting equipment:', equipmentId);
            console.log('Inserting into rental:', result.rental_id);
            await db.insertRentalEquipment(result.rental_id, equipmentId);
        }

        // send confirmation email
        try {
            const msg = {
                to: email, // Change to the user's email address
                from: 'ebracy@ramapo.edu', // Change to your verified sender
                subject: 'Rental Request Received',
                text: `Hello ${firstName} ${lastName},\n\n
                Thank you for submitting your rental request. We have received your request and will review it shortly.\n\n
                Selected Equipment: ${equipment.join(', ')}\n\n
                You will receive another email once your request has been reviewed and processed.\n\n
                Best regards,\nThe Rental Team`,
            };
            await sgMail.send(msg);
            //res.send('Test email sent successfully.');
        } catch (error) {
            console.error(error);
            res.status(500).send('Error sending test email.');
        }

        // Redirect to a success page or return a success response
        res.redirect('/rentals/success');
    } catch (error) {
        console.error('Error submitting rental:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/success', authCheck, async (req, res) => { 
    try {
        res.render('rentalSuccess', {user: req.user});
    } catch {
        console.error('Error redirecting to /success:', error);
        res.status(500).send('Internal Server Error');
    }
});




module.exports = router;