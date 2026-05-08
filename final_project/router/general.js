const express = require('express');
const axios = require('axios');

let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;

const public_users = express.Router();

const BASE_URL = 'http://localhost:5000';

// Register New User
public_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username and password are required"
    });
  }

  const userExists = users.find((user) => user.username === username);

  if (userExists) {
    return res.status(409).json({
      success: false,
      message: "User already exists"
    });
  }

  users.push({ username, password });

  return res.status(201).json({
    success: true,
    message: "User registered successfully"
  });
});


// Task 1: Get all books -- using Promise callback
public_users.get('/', function (req, res) {

  new Promise((resolve, reject) => {
    if (books) {
      resolve(books);
    } else {
      reject(new Error("Books data not available"));
    }
  })
    .then((allBooks) => {
      return res.status(200).json({
        success: true,
        books: allBooks
      });
    })
    .catch((error) => {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch books",
        error: error.message
      });
    });

});


// Task 2: Get book details based on ISBN -- using Axios with async/await
public_users.get('/isbn/:isbn', async function (req, res) {

  try {
    const isbn = req.params.isbn;

    // Fetch all books via Axios
    const response = await axios.get(`${BASE_URL}/`);
    const allBooks = Object.values(response.data.books);

    // Find the book matching the given ISBN
    const resultBook = allBooks.find((book) => book.isbn === isbn);

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


// Task 3: Get book details based on author -- using Axios with Promise callback
public_users.get('/author/:author', function (req, res) {

  const author = req.params.author.toLowerCase();

  // Fetch all books via Axios using Promise .then()/.catch()
  axios.get(`${BASE_URL}/`)
    .then((response) => {
      const allBooks = Object.values(response.data.books);

      // Filter books where author name includes the search parameter
      const filteredBooks = allBooks.filter(
        (book) => book.author && book.author.toLowerCase().includes(author)
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
    })
    .catch((error) => {
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
    });

});


// Task 4: Get all books based on title -- using Axios with Promise callback
public_users.get('/title/:title', function (req, res) {

  const title = req.params.title.toLowerCase();

  // Fetch all books via Axios using Promise .then()/.catch()
  axios.get(`${BASE_URL}/`)
    .then((response) => {
      const allBooks = Object.values(response.data.books);

      // Filter books where title includes the search parameter
      const filteredBooks = allBooks.filter(
        (book) => book.title && book.title.toLowerCase().includes(title)
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
    })
    .catch((error) => {
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
    });

});


// Get book review -- using Axios with async/await
public_users.get('/review/:isbn', async function (req, res) {

  try {
    const isbn = req.params.isbn;

    // Fetch all books via Axios
    const response = await axios.get(`${BASE_URL}/`);
    const allBooks = Object.values(response.data.books);

    const resultBook = allBooks.find((book) => book.isbn === isbn);

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