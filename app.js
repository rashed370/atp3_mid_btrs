const express       = require('express');
const session       = require('express-session');
const bodyParser    = require('body-parser');
const cookieParser  = require('cookie-parser');
const ejs           = require('ejs');
const login           = require('./controllers/login');
const logout           = require('./controllers/logout');
const register           = require('./controllers/register');
const cancel           = require('./controllers/cancel');
const printverify           = require('./controllers/printverify');
const supportticket           = require('./controllers/supportticket');
const system           = require('./controllers/system');
const ajax           = require('./controllers/ajax');


const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:false}));
app.use(session({secret:'xtsgbx', saveUninitialized: true, resave: false}));
app.use(cookieParser());
app.use('/assets', express.static('assets'));
app.use('/login', login);
app.use('/logout', logout);
app.use('/register', register);
app.use('/cancel', cancel);
app.use('/printverify', printverify);
app.use('/supportticket', supportticket);
app.use('/system', system);
app.use('/ajax', ajax);


app.get('/', (request, response) => {
    response.render('index');
});

app.listen(3100, ()=>{
    console.log('server started at http://localhost:3100/');
});
