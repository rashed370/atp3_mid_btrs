const express = require('express');
const router = express.Router();
const Users = require("../models/users");
const BusCounters = require("../models/buscounters");
const Buses = require("../models/buses");
const BusSchedules = require("../models/busschedules");
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
                } else if (user.role=='counterstaff') {
                    return BusCounters.getById(user.operator, counter => {
                        if(counter && counter.operator) {
                            request.user.busoperator = counter.operator;
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
    if(request.user.role=='admin') {
        return response.render('system/supportstaff/add', {logged: request.user});
    }
    
    response.redirect('/system');
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
    if(request.user.role=='admin') {
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
    } else {
        response.redirect('/system');
    }
});

router.get('/supportstaff/edit/:id', (request, response) => {
    if(request.user.role=='admin') {
        return Users.getById(request.params.id, result => {
            if(result && result.role!=null) {
                if(result.role=='supportstaff') {
                    response.render('system/supportstaff/edit', {logged: request.user, supportstaff: result});
                } else {
                    response.render('system/errors', {logged: request.user, title: 'Edit Support Staff', header: 'Error Occured', errors: ['User not found'], goback: '/system/supportstaff'});
                }
            } else {
                response.render('system/errors', {logged: request.user, title: 'Edit Support Staff', header: 'Error Occured', errors: ['User not found'], goback: '/system/supportstaff'});
            } 
        });
    }

    response.redirect('/system'); 
});

router.post('/supportstaff/edit/:id', [
    check('name','Name is required').not().isEmpty().trim().escape(),
    check('email', 'Email is required').not().isEmpty().trim().escape().isEmail().normalizeEmail().withMessage('Invalid Email'),
], (request, response) => {
    const errors = validationResult(request);
    const converted = [];

    if(errors && errors.errors) {
        errors.errors.forEach(error => {
            converted.push(error.msg);
        });
    }

    if(request.user.role=='admin') {
        return Users.getById(request.params.id, result => {
            if(result && result.role!=null) {
                if(result.role=='supportstaff') {
                    if(!(converted.length>0)) {
                        let userdata = {
                            email : request.body.email,
                            password : request.body.password!='' ? request.body.password : result.password,
                            name : request.body.name,
                            company : result.company,
                            operator : result.operator,
                            id : result.id
                        }
                        if(result.email!=request.body.email) {
                            Users.getByEmail(request.body.email, user => {
                                if(user==null) {
                                    Users.update(userdata, result => {
                                        if(result) {
                                            response.render('system/success', {logged: request.user, title: 'Edit Support Staff', header: 'Update Successfull', msgs: ['Information updated successfully'], goback: ['/system/supportstaff', 'Go Back to Support Staff']});
                                        } else {
                                            response.render('system/errors', {logged: request.user, title: 'Edit Support Staff', header: 'Error Occured', errors: ['Something went wrong. Please try again'], goback: '/system/supportstaff/edit/'+request.params.id});
                                        }
                                    });
                                } else {
                                    response.render('system/errors', {logged: request.user, title: 'Edit Support Staff', header: 'Error Occured', errors: ['Email Already Exists'], goback: '/system/supportstaff/edit/'+request.params.id});
                                }
                            });
                        } else {
                            Users.update(userdata, result => {
                                if(result) {
                                    response.render('system/success', {logged: request.user, title: 'Edit Support Staff', header: 'Update Successfull', msgs: ['Information updated successfully'], goback: ['/system/supportstaff', 'Go Back to Support Staff']});
                                } else {
                                    response.render('system/errors', {logged: request.user, title: 'Edit Support Staff', header: 'Error Occured', errors: ['Something went wrong. Please try again'], goback: '/system/supportstaff/edit/'+request.params.id});
                                }
                            });
                        } 
                    } else {
                        response.render('system/errors', {logged: request.user, title: 'Edit Support Staff', header: 'Error Occured', errors: converted, goback: '/system/supportstaff/edit/'+request.params.id});
                    } 
                } else {
                    response.render('system/errors', {logged: request.user, title: 'Edit Support Staff', header: 'Error Occured', errors: ['User not found'], goback: '/system/supportstaff'});
                }
            } else {
                response.render('system/errors', {logged: request.user, title: 'Edit Support Staff', header: 'Error Occured', errors: ['User not found'], goback: '/system/supportstaff'});
            } 
        });
    }

    response.redirect('/system'); 
});

router.get('/supportstaff/remove/:id', (request, response) => {
    if(request.user.role=='admin') {
        return Users.getById(request.params.id, result => {
            if(result && result.role!=null) {
                if(result.role=='supportstaff') {
                    Users.delete(result.id, status=> {
                        if(status) {
                            response.render('system/success', {logged: request.user, title: 'Delete Support Staff', header: 'Removed Successfull', msgs: [result.name + ' removed successfully'], goback: ['/system/supportstaff', 'Go Back to Support Staff']});
                        }
                    });
                } else {
                    response.render('system/errors', {logged: request.user, title: 'Delete Support Staff', header: 'Error Occured', errors: ['User not found'], goback: '/system/supportstaff'});
                }
            } else {
                response.render('system/errors', {logged: request.user, title: 'Delete Support Staff', header: 'Error Occured', errors: ['User not found'], goback: '/system/supportstaff'});
            } 
        });
    }

    response.redirect('/system'); 
});

router.get('/busmanager', (request, response) => {
    if(request.user.role=='admin' || request.user.role == 'supportstaff') {
        return Users.getBusManagers(result => {
            response.render('system/busmanager/index', {logged: request.user, busmanagers: result});
        });
    }

    response.redirect('/system');
});

router.get('/busmanager/edit/:id', (request, response) => {
    if(request.user.role=='admin' || request.user.role=='supportstaff') {
        return Users.getById(request.params.id, result => {
            if(result && result.role!=null) {
                if(result.role=='busmanager') {
                    response.render('system/busmanager/edit', {logged: request.user, busmanager: result});
                } else {
                    response.render('system/errors', {logged: request.user, title: 'Edit Bus Manager', header: 'Error Occured', errors: ['User not found'], goback: '/system/busmanager'});
                }
            } else {
                response.render('system/errors', {logged: request.user, title: 'Edit Bus Manager', header: 'Error Occured', errors: ['User not found'], goback: '/system/busmanager'});
            } 
        });
    }

    response.redirect('/system'); 
});

router.post('/busmanager/edit/:id', [
    check('name','Name is required').not().isEmpty().trim().escape(),
    check('company','Company is required').not().isEmpty().trim().escape(),
    check('email', 'Email is required').not().isEmpty().trim().escape().isEmail().normalizeEmail().withMessage('Invalid Email'),
], (request, response) => {
    const errors = validationResult(request);
    const converted = [];

    if(errors && errors.errors) {
        errors.errors.forEach(error => {
            converted.push(error.msg);
        });
    }

    if(request.user.role=='admin' || request.user.role=='supportstaff') {
        return Users.getById(request.params.id, result => {
            if(result && result.role!=null) {
                if(result.role=='busmanager') {
                    if(!(converted.length>0)) {
                        let userdata = {
                            email : request.body.email,
                            password : request.body.password!='' ? request.body.password : result.password,
                            name : request.body.name,
                            company : request.body.company,
                            operator : result.operator,
                            id : result.id
                        }
                        if(result.email!=request.body.email) {
                            Users.getByEmail(request.body.email, user => {
                                if(user==null) {
                                    Users.update(userdata, result => {
                                        if(result) {
                                            response.render('system/success', {logged: request.user, title: 'Edit Bus Manager', header: 'Update Successfull', msgs: ['Information updated successfully'], goback: ['/system/busmanager', 'Go Back to Bus Manager']});
                                        } else {
                                            response.render('system/errors', {logged: request.user, title: 'Edit Bus Manager', header: 'Error Occured', errors: ['Something went wrong. Please try again'], goback: '/system/busmanager/edit/'+request.params.id});
                                        }
                                    });
                                } else {
                                    response.render('system/errors', {logged: request.user, title: 'Edit Bus Manager', header: 'Error Occured', errors: ['Email Already Exists'], goback: '/system/busmanager/edit/'+request.params.id});
                                }
                            });
                        } else {
                            Users.update(userdata, result => {
                                if(result) {
                                    response.render('system/success', {logged: request.user, title: 'Edit Bus Manager', header: 'Update Successfull', msgs: ['Information updated successfully'], goback: ['/system/busmanager', 'Go Back to Bus Manager']});
                                } else {
                                    response.render('system/errors', {logged: request.user, title: 'Edit Bus Manager', header: 'Error Occured', errors: ['Something went wrong. Please try again'], goback: '/system/busmanager/edit/'+request.params.id});
                                }
                            });
                        } 
                    } else {
                        response.render('system/errors', {logged: request.user, title: 'Edit Bus Manager', header: 'Error Occured', errors: converted, goback: '/system/busmanager/edit/'+request.params.id});
                    } 
                } else {
                    response.render('system/errors', {logged: request.user, title: 'Edit Bus Manager', header: 'Error Occured', errors: ['User not found'], goback: '/system/busmanager'});
                }
            } else {
                response.render('system/errors', {logged: request.user, title: 'Edit Bus Manager', header: 'Error Occured', errors: ['User not found'], goback: '/system/busmanager'});
            } 
        });
    }

    response.redirect('/system'); 
});

router.get('/busmanager/remove/:id', (request, response) => {
    if(request.user.role=='admin') {
        return Users.getById(request.params.id, result => {
            if(result && result.role!=null) {
                if(result.role=='busmanager') {
                    Users.delete(result.id, status=> {
                        if(status) {
                            response.render('system/success', {logged: request.user, title: 'Delete Bus Manager', header: 'Removed Successfull', msgs: [result.name + ' removed successfully'], goback: ['/system/busmanager', 'Go Back to Bus Manager']});
                        }
                    });
                } else {
                    response.render('system/errors', {logged: request.user, title: 'Delete Bus Manager', header: 'Error Occured', errors: ['User not found'], goback: '/system/busmanager'});
                }
            } else {
                response.render('system/errors', {logged: request.user, title: 'Delete Bus Manager', header: 'Error Occured', errors: ['User not found'], goback: '/system/busmanager'});
            } 
        });
    }

    response.redirect('/system'); 
});

router.get('/buscounter', (request, response) => {
    if(request.user.role=='admin' || request.user.role =='supportstaff') {
        return  BusCounters.getAll(results => {
            response.render('system/buscounter/index', {logged: request.user, buscounters: results});
        });
    } else if(request.user.role == 'busmanager'){
        return  BusCounters.getByOperator(request.user.id, results => {
            response.render('system/buscounter/index', {logged: request.user, buscounters: results});
        });
    }
    response.redirect('/system');
});

router.get('/buscounter/add', (request, response) => {
    if(request.user.role=='admin' || request.user.role=='busmanager') {
        if(request.user.role=='admin') {
            return Users.getBusManagers(results => {
                results = results && results.length>0 ? results : [];
                response.render('system/buscounter/add', {logged: request.user, busmanagers: results});
            });
        } else {
            return response.render('system/buscounter/add', {logged: request.user});
        }
    }
    response.redirect('/system');
});

router.post('/buscounter/add', [
    check('name','Counter Name is required').not().isEmpty().trim().escape(),
    check('location','Counter Location is required').not().isEmpty().trim().escape(),
], (request, response) => {
    const errors = validationResult(request);
    const converted = [];

    if(errors && errors.errors) {
        errors.errors.forEach(error => {
            converted.push(error.msg);
        });
    }

    if(request.user.role == 'admin') {
        if(request.body.operator == null) {
            converted.push('Bus Operator is Required')
        } else if(request.body.operator == '') {
            converted.push('Bus Operator is Required')
        }
    } else if(request.user.role == 'busmanager') {
        request.body.operator = request.user.id;
    } else {
        converted.push('Bus Operator is Required'); 
    }

    if(request.user.role=='admin' || request.user.role=='busmanager') {
        if(!(converted.length>0)) {
            BusCounters.insert({
                operator : request.body.operator,
                name : request.body.name,
                location : request.body.location
            }, result => {
                if(result) {
                    response.render('system/success', { logged: request.user, title: 'Add Bus Counter', header: 'Add Bus Counter', msgs: ['Bus Counter Added Successfully'], goback: ['/system/buscounter', 'Go Back to Bus Counters']});
                } else {
                    response.render('system/errors', { logged: request.user, title: 'Add Bus Counter', header: 'Add Bus Counter', errors: ['Something went wrong. Please try again'], goback: '/system/buscounter/add'});
                }
            })

        } else {
            response.render('system/errors', { logged: request.user, title: 'Add Bus Counter', header: 'Add Bus Counter', errors: converted, goback: '/system/buscounter/add'});
        }
    } else {
        response.redirect('/system');
    }
});

router.get('/buscounter/edit/:id', (request, response) => {
    if( request.user.role=='admin' || request.user.role=='supportstaff' || request.user.role=='busmanager') {
        return BusCounters.getById(request.params.id, result => {
            if(result!=null) {
                return Users.getBusManagers(managers => {
                    response.render('system/buscounter/edit', {logged: request.user, buscounter: result, busmanagers: managers});
                });
            } else {
                response.render('system/errors', {logged: request.user, title: 'Edit Bus Counter', header: 'Error Occured', errors: ['Counter not found'], goback: '/system/buscounter'});
            } 
        });
    }
    response.redirect('/system');
});

router.post('/buscounter/edit/:id', [
    check('name','Counter Name is required').not().isEmpty().trim().escape(),
    check('location','Counter Location is required').not().isEmpty().trim().escape(),
], (request, response) => {
    const errors = validationResult(request);
    const converted = [];

    if(errors && errors.errors) {
        errors.errors.forEach(error => {
            converted.push(error.msg);
        });
    }

    return BusCounters.getById(request.params.id, result => {
        if(result!=null) {
            if(request.user.role == 'admin' || request.user.role == 'supportstaff') {
                if(request.body.operator == null) {
                    converted.push('Bus Operator is Required')
                } else if(request.body.operator == '') {
                    converted.push('Bus Operator is Required')
                }
            } else if(request.user.role == 'busmanager') {
                request.body.operator = result.id;
            } else {
                converted.push('Bus Operator is Required'); 
            }

            if(request.user.role=='admin' || request.user.role=='busmanager' || request.user.role == 'supportstaff') {
                if(!(converted.length>0)) {
                    BusCounters.update({
                        operator : request.body.operator,
                        name : request.body.name,
                        location : request.body.location,
                        id: result.id
                    }, result => {
                        if(result) {
                            response.render('system/success', { logged: request.user, title: 'Edit Bus Counter', header: 'Edit Bus Counter', msgs: ['Information Updated Successfully'], goback: ['/system/buscounter', 'Go Back to Bus Counters']});
                        } else {
                            response.render('system/errors', { logged: request.user, title: 'Edit Bus Counter', header: 'Edit Bus Counter', errors: ['Something went wrong. Please try again'], goback: '/system/buscounter/edit/'+request.params.id});
                        }
                    })

                } else {
                    response.render('system/errors', { logged: request.user, title: 'Add Bus Counter', header: 'Add Bus Counter', errors: converted, goback: '/system/buscounter/edit/'+request.params.id});
                }
            } else {
                response.redirect('/system');
            }
        } else {
            response.render('system/errors', {logged: request.user, title: 'Edit Bus Counter', header: 'Error Occured', errors: ['Counter not found'], goback: '/system/buscounter'});
        } 
    });
});

router.get('/buscounter/remove/:id', (request, response) => {
    if(request.user.role=='admin' || request.user.role=='busmanager') {
        return BusCounters.getById(request.params.id, result => {
            if(result !=null) {
                    BusCounters.delete(result.id, status=> {
                        if(status) {
                            response.render('system/success', {logged: request.user, title: 'Delete Bus Manager', header: 'Removed Successfull', msgs: ['Counter '+result.name + ' removed successfully'], goback: ['/system/buscounter', 'Go Back to Bus Counter']});
                        }
                    });
            } else {
                response.render('system/errors', {logged: request.user, title: 'Delete Bus Counter', header: 'Error Occured', errors: ['Counter not found'], goback: '/system/buscounter'});
            } 
        });
    }

    response.redirect('/system'); 
});

router.get('/counterstaff', (request, response) => {
    if(request.user.role=='admin' || request.user.role=='busmanager' || request.user.role=='supportstaff') {
        return Users.getCounterStaffs(result => {
            response.render('system/counterstaff/index', {logged: request.user, counterstaffs: result});
        });
    }

    response.redirect('/system');
});

router.get('/counterstaff/add', (request, response) => {
    if(request.user.role=='admin' || request.user.role=='busmanager') {
        if(request.user.role=='admin') {
            return Users.getBusManagers(results => {
                results = results && results.length>0 ? results : [];
                response.render('system/counterstaff/add', {logged: request.user, busmanagers: results});
            });
        } else {
            return BusCounters.getByOperator(request.user.id, results => {
                results = results && results.length>0 ? results : [];
                response.render('system/counterstaff/add', {logged: request.user, buscounters: results});
            });
        }
    }
    response.redirect('/system');
});

router.post('/counterstaff/add', [
    check('counter','Bus Counter is required').not().isEmpty().trim().escape(),
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
    
    if(request.user.role=='admin' || request.user.role=='busmanager') {
        if(!(converted.length>0)) {
            Users.getByEmail(request.body.email, user => {
                if(user==null) {
                    Users.insert({
                        email : request.body.email,
                        password : request.body.password,
                        name : request.body.name,
                        company : null,
                        operator : request.body.counter,
                        role : 'counterstaff',
                        validated : 1,
                        registered : new Date()
                    }, result => {
                        if(result) {
                            response.render('system/success', { logged: request.user, title: 'Add New Counter Staff', header: 'Add New Counter Staff', msgs: ['Counter Staff Added Successfully'], goback: ['/system/counterstaff', 'Go Back to Counter Staffs']});
                        } else {
                            response.render('system/errors', { logged: request.user, title: 'Add New Counter Staff', header: 'Add New Counter Staff', errors: ['Something went wrong. Please try again'], goback: '/system/counterstaff/add'});
                        }
                    })
                } else {
                    response.render('system/errors', { logged: request.user, title: 'Add New Counter Staff', header: 'Add New Support Staff', errors: ['Email Already Exists'], goback: '/system/counterstaff/add'});
                }
            });
        } else {
            response.render('system/errors', { logged: request.user, title: 'Add New Counter Staff', header: 'Add New Counter Staff', errors: converted, goback: '/system/counterstaff/add'});
        }
    } else {
        response.redirect('/system');
    }
});

router.get('/counterstaff/edit/:id', (request, response) => {
    if(request.user.role=='admin' || request.user.role=='busmanager' || request.user.role=='supportstaff') {
        return Users.getCounterStaff(request.params.id, result => {
            if(result) {
                if(request.user.role=='admin' || request.user.role=='supportstaff') {
                    return Users.getBusManagers(busmanagers => {
                        return BusCounters.getByOperator(result.operatorid, buscounters => {
                            response.render('system/counterstaff/edit', {logged: request.user, counterstaff: result, buscounters: buscounters, busmanagers: busmanagers});
                        });
                    });
                } else {
                    return BusCounters.getByOperator(result.operatorid, buscounters => {
                        response.render('system/counterstaff/edit', {logged: request.user, counterstaff: result, buscounters: buscounters});
                    });
                }
            } else {
                response.render('system/errors', {logged: request.user, title: 'Edit Counter Staff', header: 'Error Occured', errors: ['User not found'], goback: '/system/counterstaff'});
            } 
        });
    } else {
        response.redirect('/system'); 
    }  
});

router.post('/counterstaff/edit/:id', [
    check('counter','Bus Counter is required').not().isEmpty().trim().escape(),
    check('name','Name is required').not().isEmpty().trim().escape(),
    check('email', 'Email is required').not().isEmpty().trim().escape().isEmail().normalizeEmail().withMessage('Invalid Email'),
], (request, response) => {
    const errors = validationResult(request);
    const converted = [];

    if(errors && errors.errors) {
        errors.errors.forEach(error => {
            converted.push(error.msg);
        });
    }

    if(request.user.role=='admin' || request.user.role=='busmanager' || request.user.role=='supportstaff') {
        return Users.getCounterStaff(request.params.id, result => {
            if(result) {
                if(!(converted.length>0)) {
                    let userdata = {
                        email : request.body.email,
                        password : request.body.password!='' ? request.body.password : result.password,
                        name : request.body.name,
                        company : null,
                        operator : request.body.counter,
                        id : result.id
                    }
                    if(result.email!=request.body.email) {
                        Users.getByEmail(request.body.email, user => {
                            if(user==null) {
                                Users.update(userdata, result => {
                                    if(result) {
                                        response.render('system/success', {logged: request.user, title: 'Edit Counter Staff', header: 'Update Successfull', msgs: ['Information updated successfully'], goback: ['/system/counterstaff', 'Go Back to Counter Staff']});
                                    } else {
                                        response.render('system/errors', {logged: request.user, title: 'Edit Counter Staff', header: 'Error Occured', errors: ['Something went wrong. Please try again'], goback: '/system/counterstaff/edit/'+request.params.id});
                                    }
                                });
                            } else {
                                response.render('system/errors', {logged: request.user, title: 'Edit counter Staff', header: 'Error Occured', errors: ['Email Already Exists'], goback: '/system/counterstaff/edit/'+request.params.id});
                            }
                        });
                    } else {
                        Users.update(userdata, result => {
                            if(result) {
                                response.render('system/success', {logged: request.user, title: 'Edit Counter Staff', header: 'Update Successfull', msgs: ['Information updated successfully'], goback: ['/system/counterstaff', 'Go Back to Counter Staff']});
                            } else {
                                response.render('system/errors', {logged: request.user, title: 'Edit Counter Staff', header: 'Error Occured', errors: ['Something went wrong. Please try again'], goback: '/system/counterstaff/edit/'+request.params.id});
                            }
                        });
                    } 
                } else {
                    response.render('system/errors', {logged: request.user, title: 'Edit Counter Staff', header: 'Error Occured', errors: converted, goback: '/system/counterstaff/edit/'+request.params.id});
                } 
            } else {
                response.render('system/errors', {logged: request.user, title: 'Edit Counter Staff', header: 'Error Occured', errors: ['User not found'], goback: '/system/counterstaff'});
            } 
        });
    }

    response.redirect('/system'); 
});

router.get('/counterstaff/remove/:id', (request, response) => {
    if(request.user.role=='admin' || request.user.role=='busmanager') {
        return Users.getCounterStaff(request.params.id, result => {
            if(result) {
                Users.delete(result.id, status=> {
                    if(status) {
                        response.render('system/success', {logged: request.user, title: 'Delete Counter Staff', header: 'Removed Successfull', msgs: [result.name + ' removed successfully'], goback: ['/system/counterstaff', 'Go Back to Counter Staff']});
                    }
                });
            } else {
                response.render('system/errors', {logged: request.user, title: 'Delete Counter Staff', header: 'Error Occured', errors: ['User not found'], goback: '/system/counterstaff'});
            } 
        });
    }

    response.redirect('/system'); 
});

router.get('/buses', (request, response) => {
    if(request.user.role=='admin' || request.user.role =='supportstaff') {
        return  Buses.getAll(results => {
            response.render('system/buses/index', {logged: request.user, buses: results});
        });
    } else if(request.user.role == 'busmanager'){
        return  Buses.getByOperator(request.user.id, results => {
            response.render('system/buses/index', {logged: request.user, buses: results});
        });
    }
    response.redirect('/system');
});

router.get('/buses/add', (request, response) => {
    if(request.user.role=='admin' || request.user.role=='busmanager') {
        if(request.user.role=='admin') {
            return Users.getBusManagers(results => {
                results = results && results.length>0 ? results : [];
                response.render('system/buses/add', {logged: request.user, busmanagers: results});
            });
        } else {
            return response.render('system/buses/add', {logged: request.user});
        }
    }
    response.redirect('/system');
});

router.post('/buses/add', [
    check('name','Bus Name/Model is required').not().isEmpty().trim().escape(),
    check('registration','Registration No is required').not().isEmpty().trim().escape(),
    check('column','Seats Column is required').not().isEmpty().trim().escape(),
    check('row','Seats Row is required').not().isEmpty().trim().escape(),
], (request, response) => {
    const errors = validationResult(request);
    const converted = [];

    if(errors && errors.errors) {
        errors.errors.forEach(error => {
            converted.push(error.msg);
        });
    }

    if(request.user.role == 'admin') {
        if(request.body.operator == null) {
            converted.push('Bus Operator is Required')
        } else if(request.body.operator == '') {
            converted.push('Bus Operator is Required')
        }
    } else if(request.user.role == 'busmanager') {
        request.body.operator = request.user.id;
    } else {
        converted.push('Bus Operator is Required'); 
    }

    if(request.user.role=='admin' || request.user.role=='busmanager') {
        if(!(converted.length>0)) {
            Buses.insert({
                operator : request.body.operator,
                name : request.body.name,
                registration : request.body.registration,
                seats_column : request.body.column,
                seats_row : request.body.row
            }, result => {
                if(result) {
                    response.render('system/success', { logged: request.user, title: 'Add Bus', header: 'Add Bus', msgs: ['Bus Added Successfully'], goback: ['/system/buses', 'Go Back to Buses']});
                } else {
                    response.render('system/errors', { logged: request.user, title: 'Add Bus', header: 'Add Bus', errors: ['Something went wrong. Please try again'], goback: '/system/buses/add'});
                }
            })

        } else {
            response.render('system/errors', { logged: request.user, title: 'Add Bus', header: 'Add Bus', errors: converted, goback: '/system/buses/add'});
        }
    } else {
        response.redirect('/system');
    }
});

router.get('/buses/edit/:id', (request, response) => {
    response.render('system/buses/edit', {logged: request.user});
});

router.get('/busschedule', (request, response) => {
    if(request.user.role=='admin' || request.user.role =='supportstaff') {
        return  BusSchedules.getAll(results => {
            response.render('system/busschedule/index', {logged: request.user, busschedules: results});
        });
    } else if(request.user.role == 'busmanager'){
        return  BusSchedules.getByOperator(request.user.id, results => {
            response.render('system/busschedule/index', {logged: request.user, busschedules: results});
        });
    }
    response.redirect('/system');
});

router.get('/busschedule/add', (request, response) => {
    if(request.user.role=='admin' || request.user.role=='busmanager') {
        if(request.user.role=='admin') {
            return Users.getBusManagers(results => {
                results = results && results.length>0 ? results : [];
                response.render('system/busschedule/add', {logged: request.user, busmanagers: results});
            });
        } else {
            return Buses.getByOperator(request.user.id, buses => {
                return BusCounters.getByOperator(request.user.id, counters => {
                    return response.render('system/busschedule/add', {logged: request.user, buses: buses, counters: counters});
                });
            });
        }
    }
    response.redirect('/system'); 
});

router.post('/busschedule/add', [
    check('bus','Bus is required').not().isEmpty().trim().escape(),
    check('boarding','Boarding is required').not().isEmpty().trim().escape(),
    check('fare', 'Fare is required').not().isEmpty().trim().escape(),
    check('from', 'From is required').not().isEmpty().trim().escape(),
    check('to', 'To is required').not().isEmpty().trim().escape(),
    check('departure','Departure is required').not().isEmpty().trim().escape(),
    check('arrival','Arrival is required').not().isEmpty().trim().escape(),
], (request, response) => {
    const errors = validationResult(request);
    const converted = [];

    if(errors && errors.errors) {
        errors.errors.forEach(error => {
            converted.push(error.msg);
        });
    }

    if(request.user.role=='admin' || request.user.role=='busmanager') {
        if(!(converted.length>0)) {
            BusSchedules.insert({
                bus : request.body.bus,
                departure : request.body.departure,
                arrival : request.body.arrival,
                route : request.body.from + '-' + request.body.to,
                fare : request.body.fare,
                boarding : request.body.boarding
            }, result => {
                if(result) {
                    response.render('system/success', { logged: request.user, title: 'Add Bus Schedule', header: 'Add Bus Schedule', msgs: ['Bus Schedule Added Successfully'], goback: ['/system/busschedule', 'Go Back to Bus Schedules']});
                } else {
                    response.render('system/errors', { logged: request.user, title: 'Add Bus Schedule', header: 'Add Bus Schedule', errors: ['Something went wrong. Please try again'], goback: '/system/busschedule/add'});
                }
            })

        } else {
            response.render('system/errors', { logged: request.user, title: 'Add Bus Schedule', header: 'Add Bus Schedule', errors: converted, goback: '/system/busschedule/add'});
        }
    } else {
        response.redirect('/system');
    }
});

router.get('/busschedule/edit/:id', (request, response) => {
    response.render('system/busschedule/edit', {logged: request.user});
});

router.get('/booktickets', (request, response) => {
    if(request.user.role=='admin' || request.user.role=='supportstaff') {
        return Users.getBusManagers(results => {
            results = results && results.length>0 ? results : [];
            response.render('system/booktickets', {logged: request.user, busschedules:[], busmanagers: results});
        });  
    } else {
        response.render('system/booktickets', {logged: request.user, busschedules:[]});
    }    
});

router.post('/booktickets', [
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

    if(request.user.role == 'admin') {
        if(request.body.operator == null) {
            converted.push('Bus Operator is Required')
        } else if(request.body.operator == '') {
            converted.push('Bus Operator is Required')
        }
    } else if(request.user.role == 'busmanager') {
        request.body.operator = request.user.id;
    } else if(request.user.role == 'counterstaff') {
        request.body.operator = request.user.busoperator;
    } else {
        converted.push('Bus Operator is Required'); 
    }

    if(!(converted.length>0)) {
        return BusSchedules.getSearchByOperator({
            operator : request.body.operator,
            from : request.body.from,
            to : request.body.to
        }, busschedules => {
            return Users.getBusManagers(results => {
                results = results && results.length>0 ? results : [];
                response.render('system/booktickets', {logged: request.user, busschedules:busschedules, busmanagers: results});
            });
        });
    } else {
        response.render('system/errors', { logged: request.user, title: 'Search Bus Ticket', header: 'Search Bus Ticket', errors: converted, goback: '/system/booktickets'});
    }
});

router.get('/tickets', (request, response) => {
    response.render('system/tickets', {logged: request.user});
});

router.get('/transaction', (request, response) => {
    response.render('system/transactions', {logged: request.user});
});


module.exports = router;