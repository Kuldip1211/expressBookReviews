/**
 * Express Router for Public Book APIs
 * 
 * This module provides RESTful endpoints for retrieving book information
 * including all books, books by ISBN, author, and title. It implements
 * both Promise callbacks and async/await patterns with Axios for HTTP requests.
 * 
 * Features:
 * - Async/await and Promise-based implementations
 * - Comprehensive error handling with user-friendly messages
 * - Input validation and sanitization
 * - Case-insensitive searching with partial matching
 * - Response caching for performance optimization
 * - Detailed logging and debugging capabilities
 * 
 * @module routers/general
 * @requires express
 * @requires axios
 * @requires ./booksdb.js
 * @requires ./auth_users.js
 */

const express = require('express');
let books = require("./booksdb.js");
const { default: axios } = require('axios');
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

// ============================================================================
// CONFIGURATION AND UTILITIES
// ============================================================================

/**
 * Cache to store recently fetched book data to reduce API calls
 * @type {Object}
 */
const cache = {
  allBooks: null,
  timestamp: null,
  TTL: 5000 // 5 seconds cache time-to-live
};

/**
 * Base URL for internal API requests
 * @type {string}
 */
const BASE_URL = "http://localhost:5000";

/**
 * Axios instance with custom configuration
 */
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  validateStatus: function (status) {
    return status >= 200 && status < 500;
  }
});

/**
 * Validates if a string is empty or contains only whitespace
 * @param {string} value - The string to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function isValidSearchTerm(value) {
  return value && typeof value === 'string' && value.trim().length > 0;
}

/**
 * Sanitizes user input by trimming and removing special characters
 * @param {string} input - The input string to sanitize
 * @returns {string} - Sanitized string
 */
function sanitizeInput(input) {
  return input.trim().replace(/[<>\"']/g, '');
}

/**
 * Fetches all books with caching mechanism
 * Uses stored cache if available and valid
 * @async
 * @returns {Promise<Object>} - Promise containing book data
 * @throws {Error} - If API request fails
 */
async function getAllBooksWithCache() {
  const now = Date.now();
  
  // Return cached data if still valid
  if (cache.allBooks && cache.timestamp && (now - cache.timestamp) < cache.TTL) {
    console.log('📦 Returning cached book data');
    return cache.allBooks;
  }
  
  // Fetch fresh data from API
  console.log('🔄 Fetching fresh book data from API');
  const response = await axiosInstance.get('/');
  
  if (response.status === 200) {
    cache.allBooks = response.data;
    cache.timestamp = now;
    return response.data;
  }
  
  throw new Error(`Failed to fetch books: HTTP ${response.status}`);
}

/**
 * Converts an object of books to an array format
 * @param {Object} booksObject - Books in object format with IDs as keys
 * @returns {Array} - Array of book objects with their IDs included
 */
function convertBooksToArray(booksObject) {
  return Object.entries(booksObject).map(([id, book]) => ({
    id,
    ...book
  }));
}

/**
 * Creates a standardized success response
 * @param {*} data - The data to include in response
 * @param {string} message - Optional success message
 * @returns {Object} - Formatted response object
 */
function createSuccessResponse(data, message = 'Request successful') {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}

/**
 * Creates a standardized error response
 * @param {string} message - Error message
 * @param {string} details - Additional error details
 * @param {number} statusCode - HTTP status code
 * @returns {Object} - Formatted error response
 */
function createErrorResponse(message, details = '', statusCode = 500) {
  return {
    success: false,
    error: message,
    details: details || 'Please check your request and try again.',
    statusCode,
    timestamp: new Date().toISOString()
  };
}



// ============================================================================
// AUTHENTICATION ENDPOINT
// ============================================================================

/**
 * POST /register
 * Register a new user with username and password validation
 * 
 * @async
 * @param {string} req.body.username - User's desired username
 * @param {string} req.body.password - User's desired password
 * @returns {Object} - Success or error response with user details
 * 
 * @example
 * POST /register
 * Body: { "username": "john_doe", "password": "secure123" }
 * Response: { "success": true, "message": "User john_doe registered successfully" }
 */
public_users.post("/register", (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    
    // Input validation
    if (!username || !password) {
      console.warn('⚠️  Registration attempt with missing credentials');
      return res.status(400).json(createErrorResponse(
        'Validation Error',
        'Both username and password are required for registration. Please provide both fields.',
        400
      ));
    }
    
    // Sanitize inputs
    const sanitizedUsername = sanitizeInput(username);
    const sanitizedPassword = sanitizeInput(password);
    
    if (sanitizedUsername.length < 3) {
      return res.status(400).json(createErrorResponse(
        'Invalid Username',
        'Username must be at least 3 characters long.',
        400
      ));
    }
    
    if (sanitizedPassword.length < 6) {
      return res.status(400).json(createErrorResponse(
        'Invalid Password',
        'Password must be at least 6 characters long.',
        400
      ));
    }
    
    // Check if user already exists
    const userExists = users.some(user => user.username === sanitizedUsername);
    if (userExists) {
      console.warn(`⚠️  Registration attempt with existing username: ${sanitizedUsername}`);
      return res.status(409).json(createErrorResponse(
        'User Already Exists',
        `The username "${sanitizedUsername}" is already registered. Please choose a different username.`,
        409
      ));
    }
    
    // Register new user
    users.push({
      "username": sanitizedUsername,
      "password": sanitizedPassword
    });
    
    console.log(`✅ New user registered: ${sanitizedUsername}`);
    return res.status(201).json(createSuccessResponse(
      { username: sanitizedUsername },
      `User "${sanitizedUsername}" has been successfully registered! You can now login.`
    ));
    
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    return res.status(500).json(createErrorResponse(
      'Server Error',
      'An unexpected error occurred during registration. Please try again later.',
      500
    ));
  }
});

// ============================================================================
// BOOK RETRIEVAL ENDPOINTS
// ============================================================================

/**
 * GET /
 * Retrieve the complete list of all available books using Promise callbacks
 * 
 * Implementation: Promise chaining with .then() and .catch()
 * 
 * @async
 * @returns {Object} - Array of all books or error response
 * @status 200 - Successfully retrieved all books
 * @status 500 - Server error while fetching books
 * 
 * @example
 * GET /
 * Response: { "success": true, "message": "Request successful", "data": [...] }
 */
public_users.get('/', function (req, res) {
  console.log('📚 Request: Get all books');
  
  axiosInstance.get('/')
    .then((response) => {
      if (response.status === 200) {
        const booksCount = Object.keys(response.data).length;
        console.log(`✅ Successfully retrieved ${booksCount} books`);
        
        return res.status(200).json(createSuccessResponse(
          response.data,
          `Successfully retrieved ${booksCount} books from the database.`
        ));
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    })
    .catch((error) => {
      console.error('❌ Error fetching books:', error.message);
      
      const statusCode = error.response?.status || 500;
      const errorMessage = error.code === 'ECONNREFUSED' 
        ? 'Unable to connect to the books database. The server may be offline.'
        : 'Failed to retrieve books from the database.';
      
      return res.status(statusCode).json(createErrorResponse(
        errorMessage,
        `Error details: ${error.message}`,
        statusCode
      ));
    });
});


/**
 * GET /isbn/:isbn
 * Retrieve detailed information about a specific book by its ISBN number
 * Uses async/await pattern for cleaner code flow
 * 
 * Implementation: async/await with try-catch error handling
 * Features: ISBN validation, exact matching, performance optimization
 * 
 * @async
 * @param {string} req.params.isbn - The ISBN of the book to retrieve
 * @returns {Object} - Complete book object including reviews or error response
 * @status 200 - Book found and returned successfully
 * @status 400 - Invalid ISBN format
 * @status 404 - Book not found
 * @status 500 - Server error
 * 
 * @example
 * GET /isbn/9780142437230
 * Response: { "success": true, "data": { "isbn": "9780142437230", "author": "...", "title": "...", "reviews": [...] } }
 */
public_users.get('/isbn/:isbn', async function (req, res) {
  try {
    const isbn = req.params.isbn;
    
    console.log(`📖 Request: Search book by ISBN - ${isbn}`);
    
    // Validate ISBN parameter
    if (!isValidSearchTerm(isbn)) {
      console.warn(`⚠️  Invalid ISBN requested: "${isbn}"`);
      return res.status(400).json(createErrorResponse(
        'Invalid ISBN Format',
        'ISBN cannot be empty. Please provide a valid ISBN number (e.g., 9780142437230).',
        400
      ));
    }
    
    const sanitizedIsbn = sanitizeInput(isbn);
    
    // Fetch books using cache mechanism
    const allBooks = await getAllBooksWithCache();
    
    // Search for book with exact ISBN match
    let foundBook = null;
    for (const bookId in allBooks) {
      if (allBooks[bookId].isbn === sanitizedIsbn) {
        foundBook = allBooks[bookId];
        console.log(`✅ Book found with ISBN: ${sanitizedIsbn}`);
        break;
      }
    }
    
    if (foundBook) {
      return res.status(200).json(createSuccessResponse(
        foundBook,
        `Book with ISBN "${sanitizedIsbn}" found successfully.`
      ));
    } else {
      console.warn(`📌 No book found with ISBN: ${sanitizedIsbn}`);
      return res.status(404).json(createErrorResponse(
        'Book Not Found',
        `No book exists with ISBN "${sanitizedIsbn}". Please verify the ISBN and try again.`,
        404
      ));
    }
    
  } catch (error) {
    console.error('❌ Error fetching book by ISBN:', error.message);
    
    return res.status(500).json(createErrorResponse(
      'Database Connection Error',
      `Unable to retrieve book information: ${error.message}`,
      500
    ));
  }
});


/**
 * GET /author/:author
 * Retrieve all books by a specific author
 * Uses Promise chaining with advanced filtering and error handling
 * 
 * Implementation: Promise callbacks (.then/.catch) with comprehensive validation
 * Features: Case-insensitive matching, partial name matching, detailed result metadata
 * 
 * @async
 * @param {string} req.params.author - Author's name to search for
 * @param {string} req.query.exact - Optional query parameter for exact match (true/false)
 * @returns {Object} - Array of books by the author with metadata or error response
 * @status 200 - Books found successfully
 * @status 400 - Invalid author parameter
 * @status 404 - No books found for this author
 * @status 500 - Server error
 * 
 * @example
 * GET /author/Dante%20Alighieri
 * Response: { "success": true, "message": "...", "data": { "count": 1, "books": [...] } }
 * 
 * @example
 * GET /author/Dante?exact=true
 * Response: Similar to above but with exact matching
 */
public_users.get('/author/:author', function (req, res) {
  try {
    const authorName = req.params.author;
    const exactMatch = req.query.exact === 'true';
    
    console.log(`👤 Request: Search books by author - "${authorName}" (exact: ${exactMatch})`);
    
    // Validate author parameter
    if (!isValidSearchTerm(authorName)) {
      console.warn(`⚠️  Invalid author name requested: "${authorName}"`);
      return res.status(400).json(createErrorResponse(
        'Invalid Author Name',
        'Author name cannot be empty. Please provide a valid author name (e.g., "Dante Alighieri").',
        400
      ));
    }
    
    const sanitizedAuthor = sanitizeInput(authorName);
    
    // Fetch books from cache or API
    getAllBooksWithCache()
      .then((allBooks) => {
        const booksArray = Object.entries(allBooks).map(([id, book]) => ({
          bookId: id,
          ...book
        }));
        
        // Perform filtering based on exact match option
        let matchedBooks;
        if (exactMatch) {
          // Exact match (full name must match exactly)
          matchedBooks = booksArray.filter((book) =>
            book.author.toLowerCase() === sanitizedAuthor.toLowerCase()
          );
        } else {
          // Partial match (case-insensitive, contains pattern)
          matchedBooks = booksArray.filter((book) =>
            book.author.toLowerCase().includes(sanitizedAuthor.toLowerCase())
          );
        }
        
        if (matchedBooks.length > 0) {
          console.log(`✅ Found ${matchedBooks.length} book(s) by author: ${sanitizedAuthor}`);
          
          return res.status(200).json(createSuccessResponse(
            {
              author: sanitizedAuthor,
              totalBooks: matchedBooks.length,
              matchType: exactMatch ? 'exact' : 'partial',
              books: matchedBooks.map(({ bookId, ...book }) => book)
            },
            `Successfully found ${matchedBooks.length} book(s) by "${sanitizedAuthor}".`
          ));
        } else {
          console.warn(`📌 No books found for author: ${sanitizedAuthor}`);
          
          return res.status(404).json(createErrorResponse(
            'Author Not Found',
            `No books available by author "${sanitizedAuthor}". Please verify the author's name and try again. Tip: Try a partial name search.`,
            404
          ));
        }
      })
      .catch((error) => {
        console.error('❌ Error fetching books by author:', error.message);
        
        return res.status(500).json(createErrorResponse(
          'Database Connection Error',
          `Unable to retrieve books by author: ${error.message}`,
          500
        ));
      });
      
  } catch (error) {
    console.error('❌ Unexpected error in author search:', error.message);
    
    return res.status(500).json(createErrorResponse(
      'Server Error',
      `An unexpected error occurred: ${error.message}`,
      500
    ));
  }
});


/**
 * GET /title/:title
 * Retrieve all books matching a specific title
 * Uses async/await pattern for modern asynchronous handling
 * 
 * Implementation: async/await with comprehensive error handling
 * Features: Case-insensitive partial matching, sorting, detailed metadata
 * 
 * @async
 * @param {string} req.params.title - Title or part of title to search for
 * @param {string} req.query.sort - Optional sorting method (relevance/author/isbn)
 * @returns {Object} - Array of books matching the title with metadata
 * @status 200 - Books found successfully
 * @status 400 - Invalid title parameter
 * @status 404 - No books found with this title
 * @status 500 - Server error
 * 
 * @example
 * GET /title/Divine
 * Response: { "success": true, "data": { "totalBooks": 1, "books": [...] } }
 * 
 * @example
 * GET /title/tales?sort=author
 * Response: Similar to above but sorted by author
 */
public_users.get('/title/:title', async function (req, res) {
  try {
    const title = req.params.title;
    const sortBy = req.query.sort || 'relevance';
    
    console.log(`📕 Request: Search books by title - "${title}" (sort: ${sortBy})`);
    
    // Validate title parameter
    if (!isValidSearchTerm(title)) {
      console.warn(`⚠️  Invalid title requested: "${title}"`);
      return res.status(400).json(createErrorResponse(
        'Invalid Title',
        'Title cannot be empty. Please provide a book title or part of it (e.g., "Divine Comedy").',
        400
      ));
    }
    
    const sanitizedTitle = sanitizeInput(title);
    
    // Fetch books using cache mechanism
    const allBooks = await getAllBooksWithCache();
    const booksArray = Object.entries(allBooks).map(([id, book]) => ({
      bookId: id,
      ...book
    }));
    
    // Filter books by title (case-insensitive partial match)
    let matchedBooks = booksArray.filter((book) =>
      book.title.toLowerCase().includes(sanitizedTitle.toLowerCase())
    );
    
    // Apply sorting if requested
    if (matchedBooks.length > 1) {
      if (sortBy === 'author') {
        matchedBooks.sort((a, b) => a.author.localeCompare(b.author));
      } else if (sortBy === 'isbn') {
        matchedBooks.sort((a, b) => a.isbn.localeCompare(b.isbn));
      }
      // 'relevance' is default (already in order from database)
    }
    
    if (matchedBooks.length > 0) {
      console.log(`✅ Found ${matchedBooks.length} book(s) with title: ${sanitizedTitle}`);
      
      return res.status(200).json(createSuccessResponse(
        {
          searchTerm: sanitizedTitle,
          totalBooks: matchedBooks.length,
          sortedBy: sortBy,
          books: matchedBooks.map(({ bookId, ...book }) => book)
        },
        `Successfully found ${matchedBooks.length} book(s) with title matching "${sanitizedTitle}".`
      ));
    } else {
      console.warn(`📌 No books found with title: ${sanitizedTitle}`);
      
      return res.status(404).json(createErrorResponse(
        'Title Not Found',
        `No books found with a title matching "${sanitizedTitle}". Please try a different keyword or check the spelling.`,
        404
      ));
    }
    
  } catch (error) {
    console.error('❌ Error fetching books by title:', error.message);
    
    return res.status(500).json(createErrorResponse(
      'Database Connection Error',
      `Unable to retrieve books by title: ${error.message}`,
      500
    ));
  }
});

/**
 * POST /search
 * Advanced book search endpoint supporting multiple search criteria
 * 
 * Implementation: async/await with complex filtering logic
 * Features: Multi-field search, sorting, pagination-ready
 * 
 * @async
 * @param {Object} req.body - Search criteria
 * @param {string} req.body.query - Search query term
 * @param {string} req.body.searchIn - Where to search: 'title', 'author', 'isbn', 'all'
 * @param {boolean} req.body.caseSensitive - Case-sensitive search (default: false)
 * @returns {Object} - Search results with metadata
 * 
 * @example
 * POST /search
 * Body: { "query": "Dante", "searchIn": "author" }
 */
public_users.post('/search', async function (req, res) {
  try {
    const { query, searchIn = 'all', caseSensitive = false } = req.body;
    
    console.log(`🔍 Advanced search request: "${query}" in "${searchIn}"`);
    
    if (!isValidSearchTerm(query)) {
      return res.status(400).json(createErrorResponse(
        'Invalid Search Query',
        'Search query cannot be empty. Please provide a valid search term.',
        400
      ));
    }
    
    const searchQuery = caseSensitive ? query : query.toLowerCase();
    const allBooks = await getAllBooksWithCache();
    const booksArray = Object.values(allBooks);
    
    let results = [];
    
    if (searchIn === 'title' || searchIn === 'all') {
      results = results.concat(
        booksArray.filter(book => (caseSensitive ? book.title : book.title.toLowerCase()).includes(searchQuery))
      );
    }
    
    if (searchIn === 'author' || searchIn === 'all') {
      results = results.concat(
        booksArray.filter(book => (caseSensitive ? book.author : book.author.toLowerCase()).includes(searchQuery))
      );
    }
    
    if (searchIn === 'isbn' || searchIn === 'all') {
      results = results.concat(
        booksArray.filter(book => book.isbn.includes(searchQuery))
      );
    }
    
    // Remove duplicates
    results = [...new Map(results.map(item => [item.isbn, item])).values()];
    
    console.log(`✅ Search returned ${results.length} result(s)`);
    
    return res.status(200).json(createSuccessResponse(
      {
        query: query,
        searchIn: searchIn,
        totalResults: results.length,
        books: results
      },
      `Search completed. Found ${results.length} matching book(s).`
    ));
    
  } catch (error) {
    console.error('❌ Search error:', error.message);
    
    return res.status(500).json(createErrorResponse(
      'Search Failed',
      `Error during search: ${error.message}`,
      500
    ));
  }
});



// ============================================================================
// REVIEW ENDPOINTS
// ============================================================================

/**
 * GET /review/:isbn
 * Retrieve all reviews for a specific book by ISBN
 * 
 * @async
 * @param {string} req.params.isbn - ISBN of the book
 * @returns {Object} - Array of reviews or error response
 * @status 200 - Reviews retrieved successfully
 * @status 400 - Invalid ISBN
 * @status 404 - Book not found
 * 
 * @example
 * GET /review/9780142437230
 * Response: { "success": true, "data": { "isbn": "...", "reviews": [...] } }
 */
public_users.get('/review/:isbn', async function (req, res) {
  try {
    const isbn = req.params.isbn;
    
    console.log(`💬 Request: Fetch reviews for ISBN - ${isbn}`);
    
    if (!isValidSearchTerm(isbn)) {
      return res.status(400).json(createErrorResponse(
        'Invalid ISBN',
        'ISBN cannot be empty. Please provide a valid ISBN number.',
        400
      ));
    }
    
    const sanitizedIsbn = sanitizeInput(isbn);
    
    // Find book by ISBN
    let foundBook = null;
    let foundBookId = null;
    
    for (const bookId in books) {
      if (books[bookId].isbn === sanitizedIsbn) {
        foundBook = books[bookId];
        foundBookId = bookId;
        break;
      }
    }
    
    if (foundBook) {
      console.log(`✅ Book found. Retrieved ${foundBook.reviews?.length || 0} reviews`);
      
      return res.status(200).json(createSuccessResponse(
        {
          bookId: foundBookId,
          isbn: sanitizedIsbn,
          title: foundBook.title,
          author: foundBook.author,
          totalReviews: foundBook.reviews?.length || 0,
          reviews: foundBook.reviews || []
        },
        `Successfully retrieved ${foundBook.reviews?.length || 0} review(s) for this book.`
      ));
    } else {
      console.warn(`📌 Book not found with ISBN: ${sanitizedIsbn}`);
      
      return res.status(404).json(createErrorResponse(
        'Book Not Found',
        `No book exists with ISBN "${sanitizedIsbn}". Please verify and try again.`,
        404
      ));
    }
    
  } catch (error) {
    console.error('❌ Error fetching reviews:', error.message);
    
    return res.status(500).json(createErrorResponse(
      'Server Error',
      `Unable to retrieve reviews: ${error.message}`,
      500
    ));
  }
});

/**
 * GET /stats
 * Retrieve statistics about the book collection
 * 
 * Implementation: Demonstrates data aggregation and analysis
 * 
 * @async
 * @returns {Object} - Book collection statistics
 * 
 * @example
 * GET /stats
 * Response: { "success": true, "data": { "totalBooks": 10, "totalReviews": 45, "authors": [...] } }
 */
public_users.get('/stats', async function (req, res) {
  try {
    console.log('📊 Request: Fetch book collection statistics');
    
    const allBooks = await getAllBooksWithCache();
    const booksArray = Object.values(allBooks);
    
    const totalBooks = booksArray.length;
    const totalReviews = booksArray.reduce((sum, book) => sum + (book.reviews?.length || 0), 0);
    const authors = [...new Set(booksArray.map(book => book.author))];
    const booksWithReviews = booksArray.filter(book => book.reviews && book.reviews.length > 0).length;
    
    return res.status(200).json(createSuccessResponse(
      {
        totalBooks,
        totalReviews,
        totalAuthors: authors.length,
        booksWithReviews,
        averageReviewsPerBook: (totalReviews / totalBooks).toFixed(2),
        authors: authors.sort()
      },
      'Collection statistics retrieved successfully.'
    ));
    
  } catch (error) {
    console.error('❌ Error fetching statistics:', error.message);
    
    return res.status(500).json(createErrorResponse(
      'Statistics Error',
      `Unable to retrieve statistics: ${error.message}`,
      500
    ));
  }
});

/**
 * GET /health
 * Health check endpoint to verify API is running
 * 
 * @returns {Object} - Health status
 * 
 * @example
 * GET /health
 * Response: { "success": true, "status": "API is running", "timestamp": "..." }
 */
public_users.get('/health', function (req, res) {
  res.status(200).json({
    success: true,
    status: 'API is running and operational',
    service: 'Book Reviews API - Public Routes',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0'
  });
});

// ============================================================================
// EXPORT
// ============================================================================

/**
 * Export the public_users router for use in main application
 * 
 * Usage in main app:
 * const publicRouter = require('./router/general.js').general;
 * app.use('/api/public', publicRouter);
 */
module.exports.general = public_users;
