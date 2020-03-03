const express = require('express');
const router = express.Router();
const Users = require("../models/users");
const { check, validationResult } = require("express-validator");

router.all('*', (request, response, next) => {
    if(request.cookies['userid'] == null) {
        return next();
    }
    response.redirect('/system');
}); 

router.get('/', (request, response) => {
    response.render('login');
});

router.post('/', [
    check('email', 'Email is required').not().isEmpty().trim().escape(),
    check('password', 'Password is required').not().isEmpty().trim().escape()
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
            if(user!=null) {
                if(request.body.password==user.password) {
                    response.cookie('userid', user.id);
                    response.redirect('/system'); 
                } else {
                    response.render('errorblock', { title: 'Login', header: 'Login Here', errors: ['Password doesn\'t match'], goback: '/login'});
                }
            } else {
                response.render('errorblock', { title: 'Login', header: 'Login Here', errors: ['User not Exists'], goback: '/login'});
            }
        });
    } else {
        response.render('errorblock', { title: 'Login', header: 'Login Here', errors: converted, goback: '/login'});
    }
});

module.exports = router;