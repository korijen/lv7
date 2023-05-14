var User = require('../lib/user');

exports.form = function (req, res) {
    res.render('register', { title: 'Registracija' });
};

exports.submit = function (req, res, next) {
    User.getByName(req.body.name, function (err, user) {
        if (err) return next(err);
        if (user.id) {
            res.error("Korisničko ime je zauzeto!");
            res.redirect('back');
        }
        else {
            user = new User({
                name: req.body.name,
                pass: req.body.pass
            });
            user.save(function (err) {
                if (err) return next(err);
                req.session.uid = user.id;
                res.redirect('/');
            });
        }
    });
}