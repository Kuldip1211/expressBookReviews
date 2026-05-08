/**
 * @file general.js
 * @description Public routes for the Book Review Express application.
 * These routes are accessible without authentication and handle:
 *  - User registration
 *  - Retrieving all books
 *  - Retrieving books by ISBN, author, or title
 *  - Retrieving book reviews
 * All book retrieval routes use Axios HTTP requests with either
 * async/await or Promise .then()/.catch() patterns.
 */

const express = require('express');
const axios = require('axios');

let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;

const public_users = express.Router();

/** Base URL for internal Axios requests to the local book service */
const BASE_URL = 'http://localhost:5000';


/**
 * @route   POST /register
 * @desc    Register a new user with a username and password
 * @access  Public
 *
 * @param {string} req.body.username - The desired username (must be unique)
 * @param {string} req.body.password - The desired password
 *
 * @returns {201} User registered successfully
 * @returns {400} Username or password missing
 * @returns {409} Username already exists
 */
public_users.post("/register", (req, res) => {

  const { username, password } = req.body;

  // Ensure both username and password fields are provided
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username and password are required"
    });
  }

  // Check if a user with the same username already exists
  const userExists = users.find((user) => user.username === username);

  if (userExists) {
    return res.status(409).json({
      success: false,
      message: "User already exists"
    });
  }

  // Add the new user to the in-memory users array
  users.push({ username, password });

  return res.status(201).json({
    success: true,
    message: "User registered successfully"
  });

});


/**
 * @route   GET /
 * @desc    Retrieve the complete list of all books available in the shop.
 *          Uses a Promise callback pattern to wrap the synchronous books data
 *          in an asynchronous-compatible structure.
 * @access  Public
 *
 * @returns {200} JSON object containing all books
 * @returns {500} Internal server error if books data is unavailable
 */
public_users.get('/', function (req, res) {

  // Wrap books data in a Promise to demonstrate Promise callback pattern
  new Promise((resolve, reject) => {
    if (books) {
      resolve(books); // Resolve with the full books object
    } else {
      reject(new Error("Books data not available")); // Reject if data is missing
    }
  })
    .then((allBooks) => {
      // Successfully retrieved books — send back as JSON
      return res.status(200).json({
        success: true,
        books: allBooks
      });
    })
    .catch((error) => {
      // Handle any error during retrieval
      return res.status(500).json({
        success: false,
        message: "Failed to fetch books",
        error: error.message
      });
    });

});


/**
 * @route   GET /isbn/:isbn
 * @desc    Retrieve details of a single book matching the given ISBN.
 *          Uses Axios with async/await to fetch the full book list
 *          from the local server, then filters by ISBN.
 * @access  Public
 *
 * @param {string} req.params.isbn - The ISBN string to search for
 *
 * @returns {200} JSON object containing the matched book
 * @returns {404} No book found with the given ISBN
 * @returns {500} Internal server error or upstream service failure
 */
public_users.get('/isbn/:isbn', async function (req, res) {

  try {
    const isbn = req.params.isbn;

    // Use Axios to fetch the full book list from the local server
    const response = await axios.get(`${BASE_URL}/`);
    const allBooks = Object.values(response.data.books);

    // Search for the book whose ISBN matches the requested value
    const resultBook = allBooks.find((book) => book.isbn === isbn);

    // Return 404 if no matching book was found
    if (!resultBook) {
      return res.status(404).json({
        success: false,
        message: `No book found with ISBN: ${isbn}`
      });
    }

    // Return the matched book details
    return res.status(200).json({
      success: true,
      book: resultBook
    });

  } catch (error) {
    // Handle errors returned by the upstream Axios request
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: "Error from upstream service",
        error: error.response.data
      });
    }
    // Handle unexpected server-side errors
    return res.status(500).json({
      success: false,
      message: "Error fetching book by ISBN",
      error: error.message
    });
  }

});


/**
 * @route   GET /author/:author
 * @desc    Retrieve all books written by the specified author.
 *          Uses Axios with Promise .then()/.catch() to fetch the full
 *          book list from the local server, then filters by author name.
 *          The search is case-insensitive and supports partial matches.
 * @access  Public
 *
 * @param {string} req.params.author - The author name (or partial name) to search for
 *
 * @returns {200} JSON array of books matching the author
 * @returns {404} No books found for the given author
 * @returns {500} Internal server error or upstream service failure
 */
public_users.get('/author/:author', function (req, res) {

  // Normalize the author parameter to lowercase for case-insensitive comparison
  const author = req.params.author.toLowerCase();

  // Use Axios with Promise .then()/.catch() pattern to fetch all books
  axios.get(`${BASE_URL}/`)
    .then((response) => {
      const allBooks = Object.values(response.data.books);

      // Filter books where the author field contains the search string
      const filteredBooks = allBooks.filter(
        (book) => book.author && book.author.toLowerCase().includes(author)
      );

      // Return 404 if no books matched the given author
      if (filteredBooks.length === 0) {
        return res.status(404).json({
          success: false,
          message: `No books found for author: ${req.params.author}`
        });
      }

      // Return the list of matched books
      return res.status(200).json({
        success: true,
        books: filteredBooks
      });
    })
    .catch((error) => {
      // Handle errors returned by the upstream Axios request
      if (error.response) {
        return res.status(error.response.status).json({
          success: false,
          message: "Error from upstream service",
          error: error.response.data
        });
      }
      // Handle unexpected server-side errors
      return res.status(500).json({
        success: false,
        message: "Error fetching books by author",
        error: error.message
      });
    });

});


/**
 * @route   GET /title/:title
 * @desc    Retrieve all books whose title matches the given search string.
 *          Uses Axios with Promise .then()/.catch() to fetch the full
 *          book list from the local server, then filters by title.
 *          The search is case-insensitive and supports partial matches.
 * @access  Public
 *
 * @param {string} req.params.title - The title (or partial title) to search for
 *
 * @returns {200} JSON array of books matching the title
 * @returns {404} No books found with the given title
 * @returns {500} Internal server error or upstream service failure
 */
public_users.get('/title/:title', function (req, res) {

  // Normalize the title parameter to lowercase for case-insensitive comparison
  const title = req.params.title.toLowerCase();

  // Use Axios with Promise .then()/.catch() pattern to fetch all books
  axios.get(`${BASE_URL}/`)
    .then((response) => {
      const allBooks = Object.values(response.data.books);

      // Filter books where the title field contains the search string
      const filteredBooks = allBooks.filter(
        (book) => book.title && book.title.toLowerCase().includes(title)
      );

      // Return 404 if no books matched the given title
      if (filteredBooks.length === 0) {
        return res.status(404).json({
          success: false,
          message: `No books found with title: ${req.params.title}`
        });
      }

      // Return the list of matched books
      return res.status(200).json({
        success: true,
        books: filteredBooks
      });
    })
    .catch((error) => {
      // Handle errors returned by the upstream Axios request
      if (error.response) {
        return res.status(error.response.status).json({
          success: false,
          message: "Error from upstream service",
          error: error.response.data
        });
      }
      // Handle unexpected server-side errors
      return res.status(500).json({
        success: false,
        message: "Error fetching books by title",
        error: error.message
      });
    });

});


/**
 * @route   GET /review/:isbn
 * @desc    Retrieve all user reviews for the book matching the given ISBN.
 *          Uses Axios with async/await to fetch book data from the local
 *          server, then returns the reviews for the matched book.
 * @access  Public
 *
 * @param {string} req.params.isbn - The ISBN of the book whose reviews to fetch
 *
 * @returns {200} JSON object containing all reviews for the book
 * @returns {200} Message indicating no reviews exist yet (empty reviews object)
 * @returns {404} No book found with the given ISBN
 * @returns {500} Internal server error or upstream service failure
 */
public_users.get('/review/:isbn', async function (req, res) {

  try {
    const isbn = req.params.isbn;

    // Use Axios to fetch the full book list from the local server
    const response = await axios.get(`${BASE_URL}/`);
    const allBooks = Object.values(response.data.books);

    // Search for the book whose ISBN matches the requested value
    const resultBook = allBooks.find((book) => book.isbn === isbn);

    // Return 404 if no matching book was found
    if (!resultBook) {
      return res.status(404).json({
        success: false,
        message: `No book found with ISBN: ${isbn}`
      });
    }

    const reviews = resultBook.reviews;

    // Handle case where book exists but has no reviews yet
    if (!reviews || Object.keys(reviews).length === 0) {
      return res.status(200).json({
        success: true,
        message: "No reviews yet for this book",
        reviews: {}
      });
    }

    // Return all reviews for the matched book
    return res.status(200).json({
      success: true,
      reviews: reviews
    });

  } catch (error) {
    // Handle errors returned by the upstream Axios request
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: "Error from upstream service",
        error: error.response.data
      });
    }
    // Handle unexpected server-side errors
    return res.status(500).json({
      success: false,
      message: "Error fetching reviews",
      error: error.message
    });
  }

});

module.exports.general = public_users;