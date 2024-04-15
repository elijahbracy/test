const db = require('../db');

const router = require('express').Router();

// Middleware function to check if the user is authenticated and an admin
const adminCheck = (req, res, next) => {
    if (!req.user) {
        // Send a 401 status code along with a message indicating authentication is required
        return res.status(401).send({
            error: 'Authentication required',
            message: 'Please sign in to access this resource.'
        });
    }
    
    if (!req.user.isAdmin) {
        // Send a 401 status code along with a message indicating authentication is required
        return res.status(401).send({
            error: 'Authorization required',
            message: 'Please contact an admin for access.'
        });
    }
    
    // User is authenticated and is an admin, proceed to the next middleware
    next();
};


router.get('/', adminCheck, (req, res) => {
    //console.log('admin dashboard', req.user);
    res.render('dashboard', {user: req.user});
});


router.get('/users', adminCheck, async (req,res) => {
    res.render('users', {user: req.user});
});

router.get('/getUsers', adminCheck, async (req,res) => {
    try {
        const users = await db.getAllUsers();

        res.json({ users: users});
    } catch (err) {
        console.error('error fetching users:', err);
        res.status(500).send('Interal Server Error');
    }
});

router.post('/users/:id', adminCheck, async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await db.getUserById(userId);

        if (!user) {
            // Handle case where user is not found
            return res.status(404).send('User not found');
        }

        if (user.isAdmin) {
            // User is currently an admin, remove admin status
            await db.removeUserAdmin(userId);
            res.status(200).send('User removed as admin');
        } else {
            // User is not an admin, make them an admin
            await db.makeUserAdmin(userId);
            res.status(200).send('User made admin');
        }
    } catch (error) {
        // Handle errors appropriately (e.g., show an error message)
        console.error('Error updating user admin status:', error);
        res.status(500).send('An error occurred while updating user admin status.');
    }
});


router.delete('/users/:id', async (req, res) => {
    await db.deleteUser(req.params.id);
    res.status(200).send();
})

router.get('/equipment', adminCheck, async (req, res) => {
    res.render('equipment', {user: req.user});
})

router.get('/getEquipment', adminCheck, async (req,res) => {
    try {
        const equipment = await db.getEquipment();

        res.json({ equipment: equipment});
    } catch (err) {
        console.error('error fetching users:', err);
        res.status(500).send('Interal Server Error');
    }
});

module.exports = router;