var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var multer = require('multer');
//var indexRouter = require('./routes/index');
//var usersRouter = require('./routes/users');

//Dohvat modula za registraciju
var register = require('./routes/register');

//Dohvat modula za poruke
var messages = require('./lib/messages');

//Dohvat modula za login
var login = require('./routes/login');

//Dodavanje modula za dohvat korisnika iz baze podataka
var user = require('./lib/middleware/user');

//Dodavanje modula za validaciju objava
var validate = require('./lib/middleware/validate');

//Dodavanje modula za REST api
var api = require('./routes/api');

//Dodavanje modula za prikaz o pogrešci
var index = require('./routes/index');

var users = require('./routes/users');


//Zahtijevamo session modul
var session = require('express-session');
var methodOverride = require('method-override');

//Module za LV6
var Project = require("./lib/project");
var projects = require("./routes/projects");


var app = express();

//Upotreba session-a
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}))

//Upotreba poruka
app.use(messages);

//Upotreba modula za dohvat korisnika iz baze podataka
app.use(user);

app.use('/api', api.auth);


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', indexRouter);
//app.use('/users', usersRouter);

//Dodavanje ruta za registraciju
app.get('/register', register.form);
app.post('/register', register.submit);

//Dodavanje ruta za login
app.get('/login', login.form);
app.post('/login', login.submit);
app.get('/logout', login.logout);

//Dodavanje ruta za objave
app.get('/post', projects.form);
//app.post('/post', entries.submit);
app.post(
    '/post',
    validate.required('name'),
    validate.lengthAbove('name', 4),
    validate.required('desc'),
    validate.required('cost'),
    validate.required('tasks'),
    validate.required('date_start'),
    validate.required('date_finish'),
    projects.submit
);

//app.use('/', index);

//Upotreba modula za unos i prikaz objava
app.get('/', projects.index);
app.get('/projects', projects.list);
app.get("/membership", projects.membership);
app.get("/editProject", projects.editProject);

app.post("/delete", projects.delete);
app.post("/addMember", projects.addMember);
app.post("/archive", projects.archive);
app.post("/changeProject", projects.changeProject);

app.use('/users', users);

//Rute za api
app.get('/api/user/:id', api.user);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;