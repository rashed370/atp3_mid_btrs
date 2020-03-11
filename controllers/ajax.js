const express = require('express');
const router = express.Router();
const Users = require("../models/users");
const BusCounters = require("../models/buscounters");
const Buses = require("../models/buses");

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
    
    return response.json([]);
});

router.post('/getbuscounters', (request, response) => {
    return Users.getById(request.body.operator, user => {
        if(user!=null) {
            return BusCounters.getByOperator(user.id, results => {
                const counters = [];
                if(results && results.length>0) {
                    results.forEach(counter => {
                        counters.push([counter.id, counter.name]);
                    });
                }
                response.json(counters);
            });
        } else {
            response.json([]);
        }
    });
});

router.post('/getbuses', (request, response) => {
    return Users.getById(request.body.operator, user => {
        if(user!=null) {
            return Buses.getByOperator(user.id, results => {
                const buses = [];
                if(results && results.length>0) {
                    results.forEach(bus => {
                        buses.push([bus.id, bus.name + ' [ ' + bus.registration + ' ]']);
                    });
                }
                response.json(buses);
            });
        } else {
            response.json([]);
        }
    });
});

module.exports = router;