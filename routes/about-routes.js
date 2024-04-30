const router = require('express').Router();
const db = require('../db');

router.get('/contact', async(req, res) => {
    res.render('contact');
});

router.get('/hours', async(req, res) => {
    res.render('hours');
});

module.exports = router;