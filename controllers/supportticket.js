const express = require('express');
const router = express.Router();

router.get('/', (request, response) => {
    response.render('supportticket/index');
});

router.get('/add', (request, response) => {
    response.render('supportticket/add');
});

router.get('/view/:id', (request, response) => {
    response.render('supportticket/view');
});

module.exports = router;