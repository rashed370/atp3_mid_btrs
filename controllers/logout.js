const express = require("express");
const router = express.Router();

router.get('/', (request, response) => {
    if(request.cookies["userid"]!=null) {
        response.clearCookie('userid');
    }
    response.redirect('/login'); 
});

module.exports = router;