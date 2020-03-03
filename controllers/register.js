const express = require('express');
const router = express.Router();
const Users = require("../models/users");
const { check, validationResult } = require("express-validator");

router.get('/', (request, response) => {
    response.render('register');
});

router.post('/', [ 
    check('name','Name is required').not().isEmpty().trim().escape(),
    check('company', 'Company Name is required').not().isEmpty().trim().escape(),
    check('email', 'Email is required').not().isEmpty().trim().escape().isEmail().normalizeEmail().withMessage('Invalid Email'),
    check('password', 'Password is required').not().isEmpty().trim().escape(),
    check('repassword', 'Password confirmation does not match password').custom((value, { req }) => {
        return value !== req.params.password;
    })
], (request, response) => {
    const errors = validationResult(request);
    const converted = [];

    if(errors && errors.errors) {
        errors.errors.forEach(error => {
            converted.push(error.msg);
        });
    }

    if(!(converted.length>0)) {
        Users.getByEmail(request.body.email, user => {
            if(user==null) {
                Users.insert({
                    email : request.body.email,
                    password : request.body.password,
                    name : request.body.name,
                    company : request.body.company,
                    operator : null,
                    role : 'busmanager',
                    validated : 0,
                    registered : new Date()
                }, result => {
                    if(result) {
                        response.render('successblock', { title: 'Register', header: 'Register As Company', msgs: ['You\'ve Registered Successfully'], goback: ['/login', 'Please Login']});
                    } else {
                        response.render('errorblock', { title: 'Register', header: 'Register As Company', errors: ['Something went wrong. Please try again'], goback: '/register'});
                    }
                })
            } else {
                response.render('errorblock', { title: 'Register', header: 'Register As Company', errors: ['Email Already Exists'], goback: '/register'});
            }
        });
    } else {
        response.render('errorblock', { title: 'Register', header: 'Register As Company', errors: converted, goback: '/register'});
    }
});

module.exports = router;