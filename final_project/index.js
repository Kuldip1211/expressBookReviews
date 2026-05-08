const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session')
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

app.use(express.json());

app.use(
    session({
        secret: "mySecret",
        resave: false,
        saveUninitialized: false
    })
);

app.use("/customer", session({ secret: "fingerprint_customer", resave: true, saveUninitialized: true }));

app.use("/customer/review/*", function auth(req, res, next) {
    if (req.session.user && req.session.user.token) {
        jwt.verify(req.session.user.token, "secretKey", (err, decoded) => { // ✅ fixed secret
            if (err) {
                return res.status(401).json({ message: "Invalid or expired token. Please login again." });
            }
            req.user = decoded;
            next();
        });
    } else {
        return res.status(403).json({ message: "User not logged in. Please login to continue." });
    }
});

const PORT = 5000;

app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT, () => console.log("Server is running on port " + PORT));