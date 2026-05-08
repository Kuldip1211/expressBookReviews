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


// Get all books -- uses async/await
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


// Get book details based on ISBN -- uses Axios + async/await
public_users.get('/isbn/:isbn', async function (req, res) {

  try {

    const isbn = req.params.isbn;

    // Use Axios to fetch all books from the local server
    const response = await axios.get('http://localhost:5000/');

    const allBooks = response.data.books;

    // Find the book matching the given ISBN
    const resultBook = Object.values(allBooks).find(
      (book) => book.isbn === isbn
    );

    if (!resultBook) {
      return res.status(404).json({
        success: false,
        message: `No book found with ISBN: ${isbn}`
      });
    }

    return res.status(200).json({
      success: true,
      book: resultBook
    });

  } catch (error) {

    // Handle Axios-specific errors separately
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: "Error from upstream service",
        error: error.response.data
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error fetching book by ISBN",
      error: error.message
    });

  }

});


// Get book details based on author -- uses Axios + async/await
public_users.get('/author/:author', async function (req, res) {

  try {

    const author = req.params.author.toLowerCase();

    // Use Axios to fetch all books from the local server
    const response = await axios.get('http://localhost:5000/');

    if (!response.data || !response.data.books) {
      return res.status(500).json({
        success: false,
        message: "Invalid response from book service"
      });
    }

    const allBooks = Object.values(response.data.books);

    // Filter books where author name contains the search parameter (case-insensitive)
    const filteredBooks = allBooks.filter(
      (book) =>
        book.author &&
        book.author.toLowerCase().includes(author)
    );

    if (filteredBooks.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No books found for author: ${req.params.author}`
      });
    }

    return res.status(200).json({
      success: true,
      books: filteredBooks
    });

  } catch (error) {

    // Handle Axios-specific errors separately
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: "Error from upstream service",
        error: error.response.data
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error fetching books by author",
      error: error.message
    });

  }

});


// Get all books based on title -- uses Axios + async/await
public_users.get('/title/:title', async function (req, res) {

  try {

    const title = req.params.title.toLowerCase();

    // Use Axios to fetch all books from the local server
    const response = await axios.get('http://localhost:5000/');

    if (!response.data || !response.data.books) {
      return res.status(500).json({
        success: false,
        message: "Invalid response from book service"
      });
    }

    const allBooks = Object.values(response.data.books);

    // Filter books where title contains the search parameter (case-insensitive)
    const filteredBooks = allBooks.filter(
      (book) =>
        book.title &&
        book.title.toLowerCase().includes(title)
    );

    if (filteredBooks.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No books found with title: ${req.params.title}`
      });
    }

    return res.status(200).json({
      success: true,
      books: filteredBooks
    });

  } catch (error) {

    // Handle Axios-specific errors separately
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: "Error from upstream service",
        error: error.response.data
      });
    }

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

    // Use Axios to fetch all books from the local server
    const response = await axios.get('http://localhost:5000/');

    if (!response.data || !response.data.books) {
      return res.status(500).json({
        success: false,
        message: "Invalid response from book service"
      });
    }

    const allBooks = Object.values(response.data.books);

    const resultBook = allBooks.find(
      (book) => book.isbn === isbn
    );

    if (!resultBook) {
      return res.status(404).json({
        success: false,
        message: `No book found with ISBN: ${isbn}`
      });
    }

    const reviews = resultBook.reviews;

    if (!reviews || Object.keys(reviews).length === 0) {
      return res.status(200).json({
        success: true,
        message: "No reviews yet for this book",
        reviews: {}
      });
    }

    return res.status(200).json({
      success: true,
      reviews: reviews
    });

  } catch (error) {

    // Handle Axios-specific errors separately
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: "Error from upstream service",
        error: error.response.data
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error fetching reviews",
      error: error.message
    });

  }

});

module.exports.general = public_users;