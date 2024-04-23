const db = require('../db');

const router = require('express').Router();

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
        await db.addEquipment(name, quantity);
        
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
        console.error("Error deleting equipment:", err);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/rentals/:id', roleCheck('admin'), async(req, res) => {
    try {
        res.render('adminRental', {user: req.user});
    } catch (err) {
        console.error("Error deleting equipment:", err);
        res.status(500).send('Internal Server Error');
    }
});


router.get('/getAllRentals', roleCheck('admin'), async(req, res) => {
    try {
        const rentals = await db.getAllRentals();
        const rentalsWithEquipment = [];
        for (rental of rentals) {
            const rentalWithEquipment = await Promise.all(rentals.map(async (rental) => {
                const equipment = await db.getEquipmentByRental(rental.rental_id);
                rentalsWithEquipment.push({ ...rental, equipment });
            }));
            
        }
        res.status(200).json({rentalsWithEquipment});
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