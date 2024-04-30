const db = require('../db');
const knex = require('../config/knexfile');
const router = require('express').Router();
const sgMail = require('@sendgrid/mail');

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

        const equipmentNames = await db.getEquipmentByRental(result.rental_id);
        console.log(equipmentNames);

        // send confirmation email
        try {
            const msg = {
                to: email, 
                from: 'ebracy@ramapo.edu',
                subject: 'Rental Request Received',
                html: `
                <p>Hello ${firstName} ${lastName},</p>
                <p>Thank you for submitting your rental request. We have received your request and will review it shortly.</p>
                <p>Selected Equipment:</p>
                <ul>
                    ${equipmentNames.map(name => `<li>${name}</li>`).join('')}
                </ul>
                <p>You will receive another email once your request has been reviewed and processed.</p>
                <p>Best regards,<br>The Cage Team</p>
                `
            };
            await sgMail.send(msg);
            //res.send('Test email sent successfully.');
        } catch (error) {
            console.error(error);
            res.status(500).send('Error sending student request recieved email.');
        }

        // send staff notification email
        try {
            const msg = {
                to: 'ebracy@ramapo.edu', // change this to pauls for now
                from: 'ebracy@ramapo.edu', // verified sender
                subject: 'Rental Request Received',
                html: `
                    <p>Hello,</p>
                    <p>A new rental request has just been received.</p>
                    <p>Rental Information:</p>
                    <ul>
                        <li>Name: ${firstName} ${lastName}</li>
                        <li>Email: ${email}</li>
                        <li>Selected Equipment: ${equipmentNames.join(', ')}</li>
                        <li>Course: ${course}</li>
                        <li>Notes: ${notes}</li>
                    </ul>
                    <p>Please review the request and process it accordingly.</p>
                `
            };
            await sgMail.send(msg);
            //res.send('Test email sent successfully.');
        } catch (error) {
            console.error(error);
            res.status(500).send('Error sending staff request recieved notification email.');
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