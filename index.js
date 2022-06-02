// import modules/packages
const express = require('express');
const dotenv = require('dotenv');
const db = require("./src/models");
const jwt = require("jsonwebtoken");
const path = require("path");

//routes
const userRoute = require("./src/routes/user.routes");
const loginRoute = require("./src/routes/login.routes");

//initialize app
var app = express();

//parse requests of content-type application/json
app.use(express.json());

//parse requests of content-type -- application/x-www-forl-urlencoded
app.use(
    express.urlencoded({
        extended: true
    })
);

//console.log(require("crypto").randomBytes(64).toString("hex"));

//get config variables
dotenv.config();

db.sequelize
    .authenticate()
    .then(() => {
        console.log("connection has been established");
    }).catch((err) => {
        console.error("unable to connect to database:", err);
    });

//
if (process.env.ALLOW_SYNC === "true") {
    db.sequelize
        .sync({ alter: true })
        .then(() =>
            console.log("done updating database"));
}

//middleware
app.use((req, res, next) => {
    //can check session here
    console.log("request has been sent.");
    next();
});

app.get('/', (req, res) => {
    res.json({ message: "Welcome to SAS API Demo" });
});

const authenticateToken = (req, res, next) => {
    console.log(req.body);
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token == null) return res.sendStatus(401);

    //verify if token is valid
    jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
        console.log(user, err);
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

app.use('/public', express.static(path.join(__dirname + "/public/upload/")));

app.use('/api/v1/login', loginRoute);

app.use('/api/v1/user', authenticateToken, userRoute);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log('Server is running on port', PORT, '.');
});
