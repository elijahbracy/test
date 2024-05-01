const db = require('../db');
const knex = require('../config/knexfile');
const router = require('express').Router();
const moment = require('moment');
const sgMail = require('@sendgrid/mail');

// Middleware function to check if the user is authenticated and has the appropriate role
const roleCheck = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).send({
                error: 'Authentication required',
                message: 'Please sign in to access this resource.'
            });
        }
        
        if (req.user.role !== requiredRole) {
            return res.status(401).send({
                error: 'Authorization required',
                message: 'Insufficient permissions to access this resource.'
            });
        }
        
        next();
    };
};


// Route handlers
router.get('/', roleCheck('admin'), (req, res) => {
    res.render('dashboard', { user: req.user });
});

router.get('/users', roleCheck('admin'), async (req, res) => {
    res.render('users', { user: req.user });
});

router.get('/getUsers', roleCheck('admin'), async (req, res) => {
    try {
        const users = await db.getAllUsers();
        res.json({ users });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/users/:id', roleCheck('admin'), async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await db.getUserById(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        if (user.role === 'admin') {
            await db.removeUserAdmin(userId);
            res.status(200).send('User removed as admin');
        } else {
            await db.makeUserAdmin(userId);
            res.status(200).send('User made admin');
        }
    } catch (error) {
        console.error('Error updating user admin status:', error);
        res.status(500).send('An error occurred while updating user admin status.');
    }
});

router.delete('/users/:id', roleCheck('admin'), async (req, res) => {
    await db.deleteUser(req.params.id);
    res.status(200).send();
});

router.get('/equipment', roleCheck('admin'), async (req, res) => {
    res.render('equipment', { user: req.user });
});

router.post('/addEquipment', roleCheck('admin'), async (req, res) => {
    try {
        // Extract equipment data from the request body
        const { name, quantity } = req.body;
        
        // Call the function to add equipment to the database
        const equipment_id = await db.addEquipment(name, quantity);
        console.log('equipment_id', equipment_id);
        // add same amount to available
        await db.addAvailability(equipment_id, quantity);
        
        // Send a success response
        res.status(200).send('Equipment added successfully');
    } catch (err) {
        console.error('Error adding equipment:', err);
        res.status(500).send('Internal Server Error');
    }
});

router.delete('/equipment/:id', roleCheck('admin'), async (req, res) => {
    try {
        await db.deleteEquipment(req.params.id);
        res.status(200).send;
    } catch (err) {
        console.error("Error deleting equipment:", err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/equipment/:id', roleCheck('admin'), async(req, res) => {

});

router.get('/rentals', roleCheck('admin'), async(req, res) => {
    try {
        res.render('adminRentals', {user: req.user});
    } catch (err) {
        console.error("Error navigating to /rentals:", err);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/rentals/:id', roleCheck('admin'), async(req, res) => {
    try {
        //console.log('rental', rental);
        const rental = await db.getRentalById(req.params.id);
        console.log(rental);

        const formattedRental = {...rental}
        formattedRental.rental_start_date = moment(rental.rental_start_date).format('YYYY-MM-DD');
        formattedRental.rental_end_date = moment(rental.rental_end_date).format('YYYY-MM-DD');

        const equipment = await db.getEquipmentByRental(req.params.id);
        console.log('equipment: ', equipment);

        const user = await db.getUserById(rental.user_id);
        console.log(user);

        const availableEquipment = await knex('Equipment')
            .leftJoin('Availability', 'Equipment.equipment_id', 'Availability.equipment_id')
            .whereNotNull('Availability.available_quantity') // Filter out equipment with no availability
            .select('Equipment.equipment_id', 'Equipment.name');

        // Logic to determine checked equipment
        const checkedEquipment = availableEquipment.map(equipmentItem => {
            return {
                ...equipmentItem,
                checked: equipment.includes(equipmentItem.name)
            };
        });
        console.log('checkEquipment: ', checkedEquipment)
        res.render('adminRental', {user: user, rental: formattedRental, equipment: equipment, availableEquipment: availableEquipment, checkedEquipment: checkedEquipment});
    } catch (err) {
        console.error("Error getting rental:", err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/rentals/:id', roleCheck('admin'), async(req, res) => {
    console.log('req body: ', req.body);
    try {
        // Extract form data from request body
        const { user_email, user_first, user_last, staff_notes, rental_id, start_date, end_date, equipment, status, notes, course} = req.body;
        console.log('form rental id: ', rental_id);
        // Update rental entry in the database
        await db.updateRental(rental_id, start_date, end_date, equipment, status, notes, course);

        let equipmentNames = [];
        // Fetch equipment names if equipment is associated with the rental
        if (equipment.length > 0) {
            equipmentNames = await db.getEquipmentByRental(rental_id);
        }
        

        // email user if rental approved
        if (status === 'approved') {
            try {
                const msg = {
                    to: user_email, // change this to pauls for now
                    from: 'ebracy@ramapo.edu', // Change to your verified sender
                    subject: 'Rental Request Approved',
                    html: `
                        <p>Hello ${user_first},</p>
                        <p>Your rental has been approved.</p>
                        <p>Rental Information:</p>
                        <ul>
                            <li>Name: ${user_first} ${user_last}</li>
                            <li>Email: ${user_email}</li>
                            <li>Selected Equipment: ${equipmentNames.join(', ')}</li>
                            <li>Course: ${course}</li>
                            <li>Notes: ${notes}</li>
                        </ul>
                        <p>Please come to The Cage located at H-117 during our business hours to pick up your rental.</p>
                        <p>Business Hours: Mon-Fri 9:30am-4:30pm</p>
                        <p>Thank you, The Cage Team</p>`
                };
                await sgMail.send(msg);
                //res.send('Test email sent successfully.');
            } catch (error) {
                console.error(error);
                res.status(500).send('Error sending staff request recieved notification email.');
            }
        }

        // email user if rental approved
        if (status === 'denied') {
            try {
                const msg = {
                    to: user_email, // change this to pauls for now
                    from: 'ebracy@ramapo.edu', // Change to your verified sender
                    subject: 'Rental Request Denied',
                    html: `
                        <p>Hello ${user_first},</p>
                        <p>Your rental has been denied for the following reason(s):</p>
                        <p>${staff_notes}</p>
                        <p>Rental Information:</p>
                        <ul>
                            <li>Name: ${user_first} ${user_last}</li>
                            <li>Email: ${user_email}</li>
                            <li>Selected Equipment: ${equipmentNames.join(', ')}</li>
                            <li>Course: ${course}</li>
                            <li>Notes: ${notes}</li>
                        </ul>
                        <p>Please address the issue(s) in your rental request and resubmit. Contact us if you have any questions.</p>
                        <p>Thank you, The Cage Team</p>
                    `
                };
                await sgMail.send(msg);
                //res.send('Test email sent successfully.');
            } catch (error) {
                console.error(error);
                res.status(500).send('Error sending staff request recieved notification email.');
            }
        }
        
        // Redirect to a success page or send a success response
        res.redirect('/admin/rental-updated');
      } catch (error) {
        console.error('Error updating rental:', error);
        res.status(500).send('Internal Server Error');
      }
});

router.get('/rental-updated', roleCheck('admin'), async(req, res) => {
    try {
        res.render('rentalUpdateSuccess', {user: req.user});
    } catch (err) {
        console.error('Error updating rental:', err);
        res.status(500).send('Internal Server Error');
    }
});


router.get('/getAllRentals', roleCheck('admin'), async(req, res) => {
    try {
        const rentals = await db.getAllRentals();
        const rentalsWithEquipment = [];
        //console.log(rentals);
        for (rental of rentals) {
            const equipment = await db.getEquipmentByRental(rental.rental_id);
            const formattedRental = { ...rental, equipment};
            formattedRental.rental_start_date = moment(rental.rental_start_date).format('YYYY-MM-DD');
            formattedRental.rental_end_date = moment(rental.rental_end_date).format('YYYY-MM-DD');
            rentalsWithEquipment.push(formattedRental);
            //console.log({...rental, equipment})
            
        }
        console.log(rentalsWithEquipment);
        res.status(200).json({rentalsWithEquipment});
    } catch (err) {
        console.error("Error retrieving rentals:", err);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/getRentals', roleCheck('admin'), async (req, res) => {
    try {
        // Extract pagination parameters from the request query
        const { page = 1, pageSize = 10 } = req.query;

        // Calculate the offset based on the current page and page size
        const offset = (page - 1) * pageSize;

        // Retrieve rentals from the database using pagination
        const rentals = await db.getRentals(offset, pageSize);
        const rentalsWithEquipment = [];

        for (const rental of rentals) {
            const equipment = await db.getEquipmentByRental(rental.rental_id);
            const formattedRental = { ...rental, equipment };
            formattedRental.rental_start_date = moment(rental.rental_start_date).format('YYYY-MM-DD');
            formattedRental.rental_end_date = moment(rental.rental_end_date).format('YYYY-MM-DD');
            rentalsWithEquipment.push(formattedRental);
        }

        res.status(200).json({ rentalsWithEquipment });
    } catch (err) {
        console.error("Error retrieving rentals:", err);
        res.status(500).send('Internal Server Error');
    }
});


router.get('/getPendingRentals', roleCheck('admin'), async(req, res) => {
    try {
        await db.getAllRentals();
        res.status(200).send;
    } catch (err) {
        console.error("Error retrieving rentals:", err);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/getIncomingRentals', roleCheck('admin'), async(req, res) => {
    try {
        await db.getAllRentals();
        res.status(200).send;
    } catch (err) {
        console.error("Error retrieving rentals:", err);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/getOutgoingRentals', roleCheck('admin'), async(req, res) => {
    try {
        await db.getAllRentals();
        res.status(200).send;
    } catch (err) {
        console.error("Error retrieving rentals:", err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;