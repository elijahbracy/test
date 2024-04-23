const db = require('../db');
const knex = require('../config/knexfile');

const router = require('express').Router();


// api routes
router.get('/getEquipment', async (req, res) => {
    try {
        const equipmentWithAvailability = await knex('Equipment')
            .select('Equipment.*', 'Availability.available_quantity')
            .leftJoin('Availability', 'Equipment.equipment_id', 'Availability.equipment_id');
        res.json({ equipment: equipmentWithAvailability });
        console.log(equipmentWithAvailability);
    } catch (err) {
        console.error('Error fetching equipment:', err);
        res.status(500).send('Internal Server Error');
    }
});

// getting availability for a piece of equipment
router.get('/getAvailability/:id', async (req, res) => {
    try {
        const equipment_id = req.params.id;
        const availability = await db.getAvailability(equipment_id);
        res.json({ availability });
    } catch (err) {
        console.error('Error fetching equipment:', err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;