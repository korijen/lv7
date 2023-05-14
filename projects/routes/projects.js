let Project = require("../lib/project");
let User = require("../lib/user");

exports.list = (req, res, next) => {
    if (req.session.uid) {
        let project = new Project();
        project.getAllKeysByCreatorId(req.session.uid, function (err, values) {
            if (err) return next(err);

            if (values === null) {
                res.render("index", { title: "Naslovna stranica" });
                return;
            }

            let promises = [];
            for (const project_id of Object.values(values)) {
                promises.push(new Promise(function (resolve, reject) {
                    let new_project = new Project;
                    new_project.getById(project_id, function (err, val) {
                        if (err) {
                            reject(err);
                        } else {
                            val.getMembers(function (err, members) {
                                if (err) {
                                    reject(err);
                                } else {
                                    val.members = members;
                                    resolve(val);
                                }
                            });
                        }
                    });
                }));
            }

            Promise.all(promises)
                .then(function (data) {
                    let member_promises = [];
                    for (const project of data) {
                        project.users = {};
                        if (project.members) {
                            for (const member_id of Object.keys(project.members)) {
                                member_promises.push(new Promise(function (resolve, reject) {
                                    let new_user = new User;
                                    new_user.getUserFromId(member_id, function (err, user) {
                                        if (err) {
                                            reject(err);
                                        } else {
                                            project.users[user.id] = user.name;
                                            resolve(user.id);
                                        }
                                    });
                                }));
                            }
                        }
                    }
                    Promise.all(member_promises)
                        .then(function (resolves) {
                            console.log(data);
                            res.render("projects", { title: "Projekti", projects: data });
                        }).catch(function (error) {
                            return next(error[0]);
                        });
                }).catch(function (error) {
                    return next(error[0]);
                });
        });
    } else {
        res.render("index", { title: "Naslovna stranica" });
    }
}
exports.index = (req, res, next) => {
    res.render("index", { title: "Naslovna stranica" });
}

exports.form = function (req, res) {
    if (req.session.uid) {
        res.render('post', { title: 'Novi projekt' });
    } else {
        res.render("index", { title: "Naslovna stranica" });
    }
};

exports.submit = function (req, res, next) {
    if (req.session.uid) {
        var data = req.body;

        var project = new Project({
            name: data.name,
            desc: data.desc,
            cost: data.cost,
            tasks: data.tasks,
            date_start: data.date_start,
            date_finish: data.date_finish,
            creator_id: req.session.uid,
            archived: "no"
        });

        project.save(req.session.uid, function (err) {
            if (err) return next(err);
            res.redirect("/");
        });
    } else {
        res.redirect("/");
    }

};

exports.delete = function (req, res, next) {
    if (req.session.uid) {
        var id = req.body.delete;
        if (id) {
            let project = new Project();
            project.getById(id, function (err, projectToDelete) {
                if (err) return next(err);
                if (req.session.uid == projectToDelete.creator_id) {
                    projectToDelete.delete(function (err) {
                        if (err) return next(err);
                        res.redirect("/");
                    });
                }
            });
        }
    } else {
        res.redirect("/");
    }
};

exports.addMember = function (req, res, next) {
    if (req.session.uid) {
        let project_id = req.body.project_id;
        let member_name = req.body.username;

        var user = new User();
        user.getIdFromName(member_name, function (err, member_id) {
            if (err) return next(err);
            if(member_id){
                let temp = new Project();
                temp.getById(project_id, function (err, project) {
                    if (err) return next(err);

                    project.addMember(member_id, function (err, message) {
                        if (err) return next(err);
                        console.log(message);
                        return res.redirect("/projects");
                    })
                });
            } else {
                return res.redirect("/");
            }
        });
    }
};

exports.archive = function (req, res, next) {
    if (req.session.uid) {
        var id = req.body.archive;

        if (id) {
            let project = new Project();
            project.getById(id, function (err, project_to_archive) {
                if (err) return next(err);
                if (req.session.uid == project_to_archive.creator_id) {
                    project_to_archive.archive(function (err) {
                        if (err) return next(err);
                        res.redirect("/");
                    });
                }
            });
        } else {
            res.redirect("/");
        }
    }
};

exports.membership = function (req, res, next) {
    if (req.session.uid) {
        var user_id = req.session.uid;

        let temp = new Project();
        temp.getAllKeysByMembership(user_id, function (err, project_ids) {
            if (err) return next(err);

            let promises = [];
            if (project_ids) {
                for (const project_id of Object.keys(project_ids)) {
                    promises.push(new Promise(function (resolve, reject) {
                        let temp = new Project();
                        temp.getById(project_id, function (err, project) {
                            if (err) {
                                reject(err);
                            } else {
                                let user = new User();
                                user.getUserFromId(project.creator_id, function (err, creator) {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        project.creator_name = creator.name;

                                        project.getMembers(function (err, members) {
                                            if (err) {
                                                reject(err);
                                            } else {
                                                project.members = members;
                                                resolve(project);
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }));

                    Promise.all(promises)
                        .then(function (data) {
                            let promises = [];
                            for (const project of data) {
                                project.users = {};
                                if (project.members) {
                                    for (const member_id of Object.keys(project.members)) {
                                        promises.push(new Promise(function (resolve, reject) {
                                            let new_user = new User();
                                            new_user.getUserFromId(member_id, function (err, user) {
                                                if (err) {
                                                    reject(err);
                                                } else {
                                                    project.users[user.id] = user.name;
                                                    resolve(user.id);
                                                }
                                            });
                                        }));
                                    }
                                }
                            }
                            Promise.all(promises)
                                .then(function (resolves) {
                                    res.render("membership", { title: "Članstvo", projects: data });
                                }).catch(function (error) {
                                    return next(error[0]);
                                });
                        }).catch(function (error) {
                            return next(error[0]);
                        });
                }
            } else {
                res.redirect("/");
            }

        });
    } else {
        res.redirect("/");
    }
};

exports.editProject = function (req, res, next) {
    if (req.session.uid) {
        let project_id = req.query.edit;

        if (project_id) {
            let temp = new Project();
            temp.getById(project_id, function (err, project) {
                if (err) return next(err);
                if (project.creator_id == req.session.uid) {
                    res.render("edit", { title: project.name, full_edit: "yes", data: project });
                } else {
                    project.getMembers(function (err, members) {
                        if (err) return next(err);
                        if (Object.keys(members).includes(req.session.uid)) {
                            res.render("edit", { title: project.name, full_edit: "no", data: project });
                        } else {
                            res.redirect("/");
                        }
                    });
                }
            });
        } else {
            res.redirect("/");
        }
    } else {
        res.redirect("/");
    }
};

exports.changeProject = function(req, res, next){
    if(req.session.uid){
        let data = req.body;

        if(data){
            let temp = new Project();
            temp.getById(data.id, function(err, project){
                if(err) return next(err);

                var edit_check_creator = false;
                var edit_check_member = false;
                if(project.creator_id == req.session.uid){
                    edit_check_creator = true;
                }

                project.getMembers(function(err, members){
                    if(err) return next(err);
                    if(Object.keys(members).includes(req.session.uid)){
                        edit_check_member = true;
                    }

                    if(edit_check_creator){
                        project.name = data.name;
                        project.desc = data.desc;
                        project.cost = data.cost;
                        project.tasks = data.tasks;
                        project.date_start = data.date_start;
                        project.date_finish = data.date_finish;

                        project.update(project.creator_id, function(err){
                            if(err) return next(err);
                            res.redirect("/projects");
                        });
                    } else if(edit_check_member){
                        project.tasks = data.tasks;

                        project.update(project.creator_id, function(err){
                            if(err) return next(err);
                            res.redirect("/projects");
                        });
                    } else {
                        res.redirect("/");
                    }
                })
            });
        } else {
            res.redirect("/");
        }
    } else {
        res.redirect("/");
    }
}