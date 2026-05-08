const express = require("express");
const jwt = require("jsonwebtoken");
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [
  {
    username: "asad",
    password: "123",
  },
];

const isValid = (username) => {
  //returns boolean
  //write code to check is the username is valid
  return users.some((user) => user.username === username);
};

const authenticatedUser = (username, password) => {
  //returns boolean
  //write code to check if username and password match the one we have in records.
  return users.some(
    (user) => user.username === username && user.password === password
  );
};

//only registered users can login
regd_users.post("/login", (req, res) => {
  //Write your code here
  let { username, password } = req.body;

  if (authenticatedUser(username, password)) {
    console.log("users i authenticated");
    let accessToken = jwt.sign({ username }, "access", { expiresIn: "1h" });
    // Save token in session
    req.session.authorization = { accessToken };
    return res
      .status(200)
      .json({ messge: "Access granted!", token: accessToken });
  } else {
    return res
      .status(403)
      .json({ message: "Wrong Credentials! or users dont exitst" });
  }
});

const findUserName = (req) => {
  let token = req.session.authorization.accessToken;
  let decodeUser;
  try {
    decodeUser = jwt.verify(token, "access");
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
  return decodeUser.username;
   
};
// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  //Write your code here
  let {isbn} = req.params;
  let review = req.query.q;
  let userName = findUserName(req);
  // console.log(isbn,review,userName);
  if (!books[isbn].reviews) {
    books[isbn].reviews = { userName: review };
  }
  books[isbn].reviews[userName] = review;
  res.send(books[isbn]);

  return res.status(300).json({ message: "Yet to be implemented", isbn: isbn });
});

//Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
  //Write your code here
  let {isbn} = req.params;
  let userName = findUserName(req);
  let before = books[isbn].reviews[userName];
  delete books[isbn].reviews[userName];
  let after = books[isbn].reviews;
  res.json({message:`Successfully Delete reviews of ${userName} "`,"Before":before,"After":after});

  return res.status(300).json({ message: "Yet to be implemented", isbn: isbn });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;