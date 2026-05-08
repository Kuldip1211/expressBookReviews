const express = require('express');
const axios = require("axios");

let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;

const public_users = express.Router();

public_users.use(express.json());


// Register User
public_users.post("/register", (req, res) => {

  const { username, password } = req.body;

  // Check input
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username or password not provided"
    });
  }

  // Check existing user
  if (!isValid(username)) {
    return res.status(400).json({
      success: false,
      message: "Username already exists"
    });
  }

  // Add new user
  users.push({
    username,
    password
  });

  return res.status(200).json({
    success: true,
    message: "User registered successfully"
  });

});


// Get all books
public_users.get('/', async function (req, res) {

  try {

    const response = await axios.get(
      "http://localhost:5000/books"
    );

    return res.status(200).json({
      success: true,
      books: response.data
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Unable to fetch books",
      error: error.message
    });

  }

});


// Get book by ISBN
public_users.get('/isbn/:isbn', async function (req, res) {

  try {

    const isbn = req.params.isbn;

    const response = await axios.get(
      "http://localhost:5000/books"
    );

    const book = response.data[isbn];

    if (!book) {
      return res.status(404).json({
        success: false,
        message: `No book found with ISBN ${isbn}`
      });
    }

    return res.status(200).json({
      success: true,
      book: book
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Error fetching book by ISBN",
      error: error.message
    });

  }

});


// Get books by author
public_users.get('/author/:author', async function (req, res) {

  try {

    const author = req.params.author.toLowerCase();

    const response = await axios.get(
      "http://localhost:5000/books"
    );

    const booksByAuthor = [];

    for (let isbn in response.data) {

      if (
        response.data[isbn].author &&
        response.data[isbn].author.toLowerCase() === author
      ) {
        booksByAuthor.push(response.data[isbn]);
      }

    }

    if (booksByAuthor.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No books found for author ${req.params.author}`
      });
    }

    return res.status(200).json({
      success: true,
      books: booksByAuthor
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Error fetching books by author",
      error: error.message
    });

  }

});


// Get books by title
public_users.get('/title/:title', async function (req, res) {

  try {

    const title = req.params.title.toLowerCase();

    const response = await axios.get(
      "http://localhost:5000/books"
    );

    const booksByTitle = [];

    for (let isbn in response.data) {

      if (
        response.data[isbn].title &&
        response.data[isbn].title.toLowerCase() === title
      ) {
        booksByTitle.push(response.data[isbn]);
      }

    }

    if (booksByTitle.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No books found with title ${req.params.title}`
      });
    }

    return res.status(200).json({
      success: true,
      books: booksByTitle
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Error fetching books by title",
      error: error.message
    });

  }

});


// Get book reviews
public_users.get('/review/:isbn', function (req, res) {

  try {

    const isbn = req.params.isbn;

    if (!books[isbn]) {
      return res.status(404).json({
        success: false,
        message: `No book found with ISBN ${isbn}`
      });
    }

    return res.status(200).json({
      success: true,
      reviews: books[isbn].reviews
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Error fetching reviews",
      error: error.message
    });

  }

});

module.exports.general = public_users;