const express = require('express');
const router = express.Router();
const { check, validationResult } = require("express-validator");

router.get('/', (request, response) => {
    if(request.session.supportmobile!=null){
        if(request.session.supportotp!=null) {
            response.render('supportticket/index', {mobilebool:false,otpbool:false,tablebool:true,addbool:true});
        } else {
            response.render('supportticket/index', {verifynumber:request.session.supportmobile, mobilebool:false,otpbool:true,tablebool:false,addbool:false});
        }
    } else {
        response.render('supportticket/index', {mobilebool:true,otpbool:false,tablebool:false,addbool:false});
    }
});

router.get('/changephone',(request,response)=>{

    if(request.session.supportmobile!=null){
     
        request.session.supportmobile = null;
        request.session.supportotp = null;
        response.redirect('/supportticket');
        
    }else{
        response.render('errors', {title: 'Support Ticket', active:'supportticket', header: 'Error Occured', errors: ['This might be a system glitch. please go back and try again'], goback: '/supportticket'});
    }
});
router.post('/mobile', [
    check('mobile','Mobile Number is required').not().isEmpty().trim().escape(),
], (request, response) => {
    const errors = validationResult(request);
    const converted = [];

    if(errors && errors.errors) {
        errors.errors.forEach(error => {
            converted.push(error.msg);
        });
    }

    if(request.session.supportmobile==null) {
        if(!(converted.length>0)) {
            request.session.supportmobile = request.body.mobile;
            response.redirect('/supportticket');
        } else {
            response.render('errors', {title: 'Support Ticket', active:'supportticket', header: 'Error Occured', errors: converted, goback: '/supportticket'}); 
        }
    } else {
        response.render('errors', {title: 'Support Ticket', active:'supportticket', header: 'Error Occured', errors: ['This might be a system glitch. please go back and try again'], goback: '/supportticket'});
    }
});

router.post('/otp', [
    check('otp','OTP Number is required').not().isEmpty().trim().escape(),
], (request, response) => {
    const errors = validationResult(request);
    const converted = [];

    if(errors && errors.errors) {
        errors.errors.forEach(error => {
            converted.push(error.msg);
        });
    }

    if(request.session.otp==null) {
        if(!(converted.length>0)) {
            request.session.supportotp = request.body.otp;
            response.redirect('/supportticket');
        } else {
            response.render('errors', {title: 'Support Ticket', active:'supportticket', header: 'Error Occured', errors: converted, goback: '/supportticket'}); 
        }
    } else {
        response.render('errors', {title: 'Support Ticket', active:'supportticket', header: 'Error Occured', errors: ['This might be a system glitch. please go back and try again'], goback: '/supportticket'});
    }
});

router.get('/add', (request, response) => {
    response.render('supportticket/add');
});

router.get('/view/:id', (request, response) => {
    response.render('supportticket/view');
});


module.exports = router;