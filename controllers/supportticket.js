const express = require('express');
const Supportticket = require("../models/supportticket");
const router = express.Router();
const { check, validationResult } = require("express-validator");

router.get('/', (request, response) => {
    if(request.session.supportmobile!=null){
        if(request.session.supportotp!=null) {
            Supportticket.getByOwner(request.session.supportmobile, results => {
               if(results && results.length>0){

                response.render('supportticket/index', {mobilebool:false,otpbool:false,tablebool:true,addbool:true,supporttickets:results});

               } else {
                response.render('supportticket/index', {mobilebool:false,otpbool:false,tablebool:true,addbool:true,supporttickets:[]});
               } 
         
            });
            
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

router.all('/add',(request, response, next) => {
    if(request.session.supportmobile!=null && request.session.supportotp!=null) next();
    else response.redirect('/supportticket');
});

router.get('/add', (request, response) => {
    Supportticket.getOwnerName(request.session.supportmobile, result => {
    
        response.render('supportticket/add',{name:result});
    });
    
});
router.post('/add', [ 
    check('name','Name is required').not().isEmpty().trim().escape(),
    check('subject', 'Subject is required').not().isEmpty().trim().escape(),
    check('details', 'Details is required').not().isEmpty().trim().escape(),
    
], (request, response) => {
    const errors = validationResult(request);
    const converted = [];

    if(errors && errors.errors) {
        errors.errors.forEach(error => {
            converted.push(error.msg);
        });
    }

    if(!(converted.length>0)) {     
                Supportticket.insert({
                    owner : request.session.supportmobile,
                    name : request.body.name,
                    subject : request.body.subject,
                    details : request.body.details,
                    registered : new Date()
                }, result => {
                    if(result) {
                        response.render('success', { title: 'Support Ticket',active:'supportticket', header: 'Added support tickets', msgs: ['You\'ve Support Ticket Added Successfully'], goback: ['/supportticket', 'Back']});
                    } else {
                        response.render('errors', {title: 'Support Ticket', active:'supportticket', header: 'Error Occured', errors:['Something is wrong'], goback: '/supportticket/add'}); 
                    }
                });
            
      
    } else {
        response.render('errors', {title: 'Support Ticket', active:'supportticket', header: 'Error Occured', errors: converted, goback: '/supportticket/add'});
    }
});

router.get('/view/:id', (request, response) => {
    if(request.session.supportmobile!=null){
        if(request.session.supportotp!=null) {
            Supportticket.getById(request.params.id, results => {
               if(results && results.length>0){
                 
                response.render('supportticket/view', {supporttickets:results});

               } else {
                response.render('supportticket/index', {mobilebool:false,otpbool:false,tablebool:true,addbool:true,supporttickets:[]});
               } 
         
            });
            
        } else {
            response.render('supportticket/index', {verifynumber:request.session.supportmobile, mobilebool:false,otpbool:true,tablebool:false,addbool:false});
        }
    } else {
        response.render('supportticket/index', {mobilebool:true,otpbool:false,tablebool:false,addbool:false});
    }
    
});
module.exports = router;