const express = require('express');
const router = express.Router();
const Users = require("../models/users");
const { check, validationResult } = require("express-validator");

// Check Login (Middleware)
router.all('*', (request, response, next) => {
    if(request.cookies['userid'] != null) {
        return Users.getById(request.cookies['userid'], result => {
            let user = null;
            if(result) {
                user = result;
                request.user = user;
                request.user.awaitvalidation = 0;
                if(user.role=='admin'|| user.role=='supportstaff') {
                    return Users.getAwaitValidation(result=>{
                        if(result && result.awaiting) {
                            request.user.awaitvalidation = result.awaiting;
                        }
                        return next();
                    });
                }
                
                return next();
            }
        });
    }
    
    return response.redirect('/login');
});

router.get('/', (request, response) => {
    response.render('system/dashboard', {logged: request.user});
});

router.get('/profile', (request, response) => {
    response.render('system/profile', {logged: request.user});
});

router.post('/profile', [
    check('name','Name is required').not().isEmpty().trim().escape(),
    check('company', 'Company Name is required').trim().escape().custom((value, {req}) => {
        return !(req.user.role == 'busmanager' && ( value == null || value == ''));
    }),
    check('email', 'Email is required').not().isEmpty().trim().escape().isEmail().normalizeEmail().withMessage('Invalid Email')
], (request, response) => {
    const errors = validationResult(request);
    const converted = [];

    if(errors && errors.errors) {
        errors.errors.forEach(error => {
            converted.push(error.msg);
        });
    }
    
    if(request.user.validated===1) {
        if(!(converted.length>0)) {
            let userdata = {
                email : request.body.email,
                password : request.body.password!='' ? request.body.password : request.user.password,
                name : request.body.name,
                company : request.body.company ? request.body.company : null,
                operator : request.user.operator,
                id : request.user.id
            }
            if(request.user.email!=request.body.email) {
                Users.getByEmail(request.body.email, user => {
                    if(user==null) {
                        Users.update(userdata, result => {
                            if(result) {
                                response.render('system/success', {logged: request.user, title: 'Profile', header: 'Update Successfull', msgs: ['Information updated successfully'], goback: ['/system/profile', 'Go Back to Profile']});
                            } else {
                                response.render('system/errors', {logged: request.user, title: 'Profile', header: 'Error Occured', errors: ['Something went wrong. Please try again'], goback: '/system/profile'});
                            }
                        });
                    } else {
                        response.render('system/errors', {logged: request.user, title: 'Profile', header: 'Error Occured', errors: ['Email Already Exists'], goback: '/system/profile'});
                    }
                });
            } else {
                Users.update(userdata, result => {
                    if(result) {
                        response.render('system/success', {logged: request.user, title: 'Profile', header: 'Update Successfull', msgs: ['Information updated successfully'], goback: ['/system/profile', 'Go Back to Profile']});
                    } else {
                        response.render('system/errors', {logged: request.user, title: 'Profile', header: 'Error Occured', errors: ['Something went wrong. Please try again'], goback: '/system/profile'});
                    }
                });
            } 
        } else {
            response.render('system/errors', {logged: request.user, title: 'Profile', header: 'Error Occured', errors: converted, goback: '/system/profile'});
        }
    } else {
        response.render('system/errors', {logged: request.user, title: 'Profile', header: 'Error Occured', errors: ['You are not validated yet'], goback: '/system/profile'});
    }
});

// Check Validation (Middleware)
router.all('*', (request, response, next) => {;
    if(request.user.validated && request.user.validated===1) next();
    else response.redirect('/system');
});

router.get('/validation', (request, response) => {
    if(request.user.role=='admin' || request.user.role=='supportstaff') {
        return Users.getUnvalidated(result => {
            response.render('system/validation', {logged: request.user, unvalids: result});
        });
    }
    
    response.redirect('/system');
});

router.get('/validation/remove/:id', (request, response) => {
    if(request.user.role=='admin' || request.user.role=='supportstaff') {
        return Users.getById(request.params.id, result => {
            const user = result;
            if(result && result.validated!=null) {
                if(result.validated==0) {
                    return Users.delete(result.id, result => {
                        if(result) {
                            Users.getAwaitValidation(result => {
                                if(result) {
                                    request.user.awaitvalidation = result.awaiting;
                                }
                                response.render('system/success', {logged: request.user, title: 'Validation', header: 'Validation Successfull', msgs: ['User '+user.name+' removed successfully'], goback: ['/system/validation', 'Go Back to Validation']});
                            })
                        } else {
                            response.render('system/errors', {logged: request.user, title: 'Validation', header: 'Error Occured', errors: ['Something went wrong. Please try again'], goback: '/system/validation'});
                        }
                    })
                } else {
                    response.render('system/errors', {logged: request.user, title: 'Validation', header: 'Error Occured', errors: ['User already validated. You cannot remove valid your from here'], goback: '/system/validation'});
                }
            } else {
                response.render('system/errors', {logged: request.user, title: 'Validation', header: 'Error Occured', errors: ['User not found'], goback: '/system/validation'});
            } 
        });
    }

    response.redirect('/system');
});

router.get('/validation/:id', (request, response) => {
    if(request.user.role=='admin' || request.user.role=='supportstaff') {
        return Users.getById(request.params.id, result => {
            const user = result;
            if(result && result.validated!=null) {
                if(result.validated==0) {
                    return Users.validate(result.id, result => {
                        if(result) {
                            Users.getAwaitValidation(result => {
                                if(result) {
                                    request.user.awaitvalidation = result.awaiting;
                                }
                                response.render('system/success', {logged: request.user, title: 'Validation', header: 'Validation Successfull', msgs: ['User '+user.name+' validated successfully'], goback: ['/system/validation', 'Go Back to Validation']});
                            })
                        } else {
                            response.render('system/errors', {logged: request.user, title: 'Validation', header: 'Error Occured', errors: ['Something went wrong. Please try again'], goback: '/system/validation'});
                        }
                    })
                } else {
                    response.render('system/errors', {logged: request.user, title: 'Validation', header: 'Error Occured', errors: ['User already validated'], goback: '/system/validation'});
                }
            } else {
                response.render('system/errors', {logged: request.user, title: 'Validation', header: 'Error Occured', errors: ['User not found'], goback: '/system/validation'});
            } 
        });
    }

    response.redirect('/system');
});

router.get('/supportstaff', (request, response) => {
    if(request.user.role=='admin') {
        return Users.getSupportStaffs(result => {
            response.render('system/supportstaff/index', {logged: request.user, supportstaffs: result});
        });
    }

    response.redirect('/system');
});

router.get('/supportstaff/add', (request, response) => {
    response.render('system/supportstaff/add', {logged: request.user});
});

router.post('/supportstaff/add', [
    check('name','Name is required').not().isEmpty().trim().escape(),
    check('email', 'Email is required').not().isEmpty().trim().escape().isEmail().normalizeEmail().withMessage('Invalid Email'),
    check('password', 'Password is required').not().isEmpty().trim().escape(),
    check('repassword').custom((value, { req }) => {
        if( value !== req.body.password ) {
            throw new Error('Password confirmation does not match password')
        }
        return true;
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
                    company : null,
                    operator : null,
                    role : 'supportstaff',
                    validated : 1,
                    registered : new Date()
                }, result => {
                    if(result) {
                        response.render('system/success', { logged: request.user, title: 'Register', header: 'Add New Support Staff', msgs: ['Support Staff Added Successfully'], goback: ['/system/supportstaff', 'Go Back to Support Staffs']});
                    } else {
                        response.render('system/errors', { logged: request.user, title: 'Register', header: 'Add New Support Staff', errors: ['Something went wrong. Please try again'], goback: '/system/supportstaff/add'});
                    }
                })
            } else {
                response.render('system/errors', { logged: request.user, title: 'Register', header: 'Add New Support Staff', errors: ['Email Already Exists'], goback: '/system/supportstaff/add'});
            }
        });
    } else {
        response.render('system/errors', { logged: request.user, title: 'Register', header: 'Add New Support Staff', errors: converted, goback: '/system/supportstaff/add'});
    }
});

router.get('/supportstaff/edit/:id', (request, response) => {
    if(request.user.role=='admin') {
        return Users.getById(request.params.id, result => {
            if(result && result.role!=null) {
                if(result.role=='supportstaff') {
                    response.render('system/supportstaff/edit', {logged: request.user, supportstaff: result});
                } else {
                    response.render('system/errors', {logged: request.user, title: 'Edit Support Staff', header: 'Error Occured', errors: ['User not found 2'], goback: '/system/supportstaff'});
                }
            } else {
                response.render('system/errors', {logged: request.user, title: 'Edit Support Staff', header: 'Error Occured', errors: ['User not found 1'], goback: '/system/supportstaff'});
            } 
        });
    }

    response.redirect('/system'); 
});

router.get('/busmanager', (request, response) => {
    response.render('system/busmanager/index', {logged: request.user, busmanagers:[]});
});

router.get('/busmanager/edit/:id', (request, response) => {
    response.render('system/busmanager/edit', {logged: request.user});
});

router.get('/buscounter', (request, response) => {
    response.render('system/buscounter/index', {logged: request.user});
});

router.get('/buscounter/add', (request, response) => {
    response.render('system/buscounter/add', {logged: request.user});
});

router.get('/buscounter/edit/:id', (request, response) => {
    response.render('system/buscounter/edit', {logged: request.user});
});

router.get('/counterstaff', (request, response) => {
    response.render('system/counterstaff/index', {logged: request.user});
});

router.get('/counterstaff/add', (request, response) => {
    response.render('system/counterstaff/add', {logged: request.user});
});

router.get('/counterstaff/edit/:id', (request, response) => {
    response.render('system/counterstaff/edit', {logged: request.user});
});

router.get('/buses', (request, response) => {
    response.render('system/buses/index', {logged: request.user});
});

router.get('/buses/add', (request, response) => {
    response.render('system/buses/add', {logged: request.user});
});

router.get('/buses/edit/:id', (request, response) => {
    response.render('system/buses/edit', {logged: request.user});
});

router.get('/busschedule', (request, response) => {
    response.render('system/busschedule/index', {logged: request.user});
});

router.get('/busschedule/add', (request, response) => {
    response.render('system/busschedule/add', {logged: request.user});
});

router.get('/busschedule/edit/:id', (request, response) => {
    response.render('system/busschedule/edit', {logged: request.user});
});

router.get('/booktickets', (request, response) => {
    response.render('system/booktickets', {logged: request.user});
});

router.get('/tickets', (request, response) => {
    response.render('system/tickets', {logged: request.user});
});

router.get('/transaction', (request, response) => {
    response.render('system/transactions', {logged: request.user});
});


module.exports = router;