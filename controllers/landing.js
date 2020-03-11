const express = require('express');
const router = express.Router();
const BusSchedules = require("../models/busschedules");
const { check, validationResult } = require("express-validator");

router.get('/', (request, response) => {
    response.render('index', {busschedules:[]});
});

router.post('/', [
    check('from','From is required').not().isEmpty().trim().escape(),
    check('to','To is required').not().isEmpty().trim().escape(),
    check('departure','Departure is required').not().isEmpty().trim().escape(),
], (request, response) => {
    const errors = validationResult(request);
    const converted = [];

    if(errors && errors.errors) {
        errors.errors.forEach(error => {
            converted.push(error.msg);
        });
    }

    if(!(converted.length>0)) {
        return BusSchedules.getSearch({
            from : request.body.from,
            to : request.body.to
        }, busschedules => {
            response.render('index', {busschedules:busschedules});
        });
    } else {
        response.render('errors', { active: 'search', title: 'Search Bus Ticket', header: 'Search Bus Ticket', errors: converted, goback: '/'});
    }
});

module.exports = router;