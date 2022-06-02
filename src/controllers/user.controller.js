const db = require("../models");
const User = db.User;
const bcrypt = require("bcrypt");
const datatable = require("sequelize-datatables");

exports.findDataTable = (req, res) => {
    req.body = {
        draw: "1",
        columns: [
            {
                data: "full_name",
                name: "",
                searchable: "true",
                orderable: "true",
                search: {
                    value: "",
                    regex: "false",
                },
            },
        ],
        irder: [
            {
                column: "0",
                dir: "asc",
            },
        ],
        start: "0",
        length: "10",
        search: {
            value: "",
            regex: "false",
        },
        _: "1478912938246",
    };

    datatable(User, req.body).then((result) => {
        //result is response for datatables
        res.json(result);
    });
};

//Create and save user
exports.create = async (req, res) => {
    console.log('HERE AT request.body', req.body);
    req.body.profile_pic = req.file != undefined ? req.file.filename : "";
    req.body.full_name = "";
    req.body.created_by = req.user.id;

    req.body.password = await bcrypt.hash(
        req.body.password,
        parseInt(process.env.SALT_ROUND)
    );

    User.create(req.body, { include: ["user_task"] })
        .then((data) => {
            User.findByPk(data.id, { include: ["created", "user_task"] }).then((result) => {
                res.send({
                    error: false,
                    data: result,
                    message: "User is created successfully.",
                });
            });
        })
        .catch((err) => {
            res.status(500).send({
                error: true,
                data: [],
                message: err.errors.map((e) => e.message),
            });
        });
};

//retrieve all user from the db
exports.findAll = (req, res) => {
    User.findAll({
        where: { status: "Active" }, include: [
            "created",
            {
                model: db.Task, as: "user_task",
                include: [{
                    model: db.User, as: "created",
                    attributes: ["id", "full_name"]
                }]
            }
        ]
    }).then((data) => {
        res.send({
            error: false,
            data: data,
            message: [process.env.SUCCESS_RETRIEVED],
        });
    });
};

//find a single user with an id
exports.findOne = (req, res) => {
    const id = req.params.id;

    User.findByPk(id)
        .then((data) => {
            res.send({
                error: false,
                data: data,
                message: [process.env.SUCCESS_RETRIEVED],
            });
        })
        .catch((err) => {
            res.status(500).send({
                error: true,
                data: [],
                message: err.errors.map((e) => e.message) || process.env.GENERAL_ERROR_MESSAGE,
            });
        });
};

//update a user by id
exports.update = async (req, res) => {
    const id = req.params.id;

    req.body.full_name = "";
    if (req.body.password) {
        //req.body.password = await bcrypt.hash(req.body.password, parseInt(process.env.SALT_ROUND));
    }

    User.update(req.body, {
        where: { id: id },
    })
        .then((result) => {
            console.log(result);
            if (result) {
                //success
                User.findByPk(id).then((data) => {
                    res.send({
                        error: false,
                        data: data,
                        message: [process.env.SUCCESS_UPDATE],
                    });
                });
            }
            else {
                //error
                res.status(500).send({
                    error: true,
                    data: [],
                    message: ["Error updating record/s."],
                });
            }
        }).catch((err) => {
            res.status(500).send({
                error: true,
                data: [],
                message: err.errors.map((e) => e.message),
            });
        });

};

//update status only
exports.delete = async (req, res) => {
    const id = req.params.id;
    const body = { status: "Inactive" };

    User.update(body, {
        where: { id: id },
    })
        .then((result) => {
            if (result) {
                //success
                User.findByPk(id).then((data) => {
                    res.send({
                        error: false,
                        data: data,
                        message: [process.env.SUCCESS_UPDATE],
                    });
                });
            }
            else {
                //error
                res.status(500).send({
                    error: true,
                    data: [],
                    message: ["Error updating record/s."],
                });
            }
        }).catch((err) => {
            res.status(500).send({
                error: true,
                data: [],
                message: err.errors.map((e) => e.message),
            });
        });
};
