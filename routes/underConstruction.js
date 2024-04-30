const router = require('express').Router();

router.get('/', async (req, res) => {
    res.render('underConstruction');
});

module.exports = router;