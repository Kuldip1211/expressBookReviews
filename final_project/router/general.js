const express = require('express');
const axios = require('axios');

let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;

const public_users = express.Router();


// Register New User
public_users.post("/register", (req, res) => {

  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username and password are required"
    });
  }

  // Check if user already exists
  const userExists = users.find(
    (user) => user.username === username
  );

  if (userExists) {
    return res.status(409).json({
      success: false,
      message: "User already exists"
    });
  }

  // Add user
  users.push({
    username,
    password
  });

  return res.status(201).json({
    success: true,
    message: "User registered successfully"
  });
});


// Get all books
public_users.get('/', async function (req, res) {

  try {

    return res.status(200).json({
      success: true,
      books: books
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Failed to fetch books",
      error: error.message
    });

  }

});


// Get book details based on ISBN
public_users.get('/isbn/:isbn', async function (req, res) {

  try {

    const isbn = req.params.isbn;

    const resultBook = Object.values(books).find(
      (book) => book.isbn === isbn
    );

    if (!resultBook) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    return res.status(200).json({
      success: true,
      book: resultBook
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Error fetching book by ISBN",
      error: error.message
    });

  }

});


// Get book details based on author
public_users.get('/author/:author', async function (req, res) {

  try {

    const author = req.params.author.toLowerCase();

    // Axios request
    const response = await axios.get(
      'http://localhost:5000/'
    );

    const allBooks = Object.values(response.data.books);

    // Filter books by author
    const filteredBooks = allBooks.filter(
      (book) =>
        book.author &&
        book.author.toLowerCase() === author
    );

    if (filteredBooks.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Author not found"
      });
    }

    return res.status(200).json({
      success: true,
      books: filteredBooks
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Error fetching books by author",
      error: error.message
    });

  }

});


// Get all books based on title
public_users.get('/title/:title', async function (req, res) {

  try {

    const title = req.params.title.toLowerCase();

    // Axios request
    const response = await axios.get(
      'http://localhost:5000/'
    );

    const allBooks = Object.values(response.data.books);

    // Filter books by title
    const filteredBooks = allBooks.filter(
      (book) =>
        book.title &&
        book.title.toLowerCase() === title
    );

    if (filteredBooks.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Title not found"
      });
    }

    return res.status(200).json({
      success: true,
      books: filteredBooks
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Error fetching books by title",
      error: error.message
    });

  }

});


// Get book review
public_users.get('/review/:isbn', async function (req, res) {

  try {

    const isbn = req.params.isbn;

    const resultBook = Object.values(books).find(
      (book) => book.isbn === isbn
    );

    if (!resultBook) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    return res.status(200).json({
      success: true,
      reviews: resultBook.reviews
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