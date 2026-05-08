const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();


public_users.post("/register", (req, res) => {
  //Write your code here
  return res.status(300).json({ message: "Yet to be implemented" });
});

// Get the book list available in the shop
public_users.get('/', function (req, res) {
  //Write your code here
  return res.status(300).json({ success: true, books: books });
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', function (req, res) {
  const isbn = req.params.isbn

  const ResutBooks = Object.values(books).find(
    (e) => e.isbn === isbn
  );
  //Write your code here
  return res.status(300).json({ success: true, books: ResutBooks });
});

// Get book details based on author
public_users.get('/author/:author', function (req, res) {
  //Write your code here
  const Author = req.params.author

  const ResultBooks = Object.values(books).find(
    (e) => e.author === Author
  );

  return res.status(300).json({
    success: true,
    data: ResultBooks
  });
});

// Get all books based on title
public_users.get('/title/:title', function (req, res) {
  //Write your code here
  const Title = req.params.title

   const ResultBooks = Object.values(books).find(
    (e) => e.title === Title
  );

  return res.status(300).json({
    success: true,
    data: ResultBooks
  });
});

//  Get book review
public_users.get('/review/:isbn', function (req, res) {
  //Write your code here
  const isbn = req.params.isbn

   const ResutBooks = Object.values(books).find(
    (e) => e.isbn === isbn
  );

  return res.status(300).json({
    success: true,
    data: ResutBooks.reviews
  });

});

module.exports.general = public_users;
