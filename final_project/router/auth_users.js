const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

// ✅ FIX: Implemented isValid — checks if username already exists in users array
const isValid = (username) => {
  if (!username || typeof username !== "string") return false;
  return users.some((user) => user.username === username);
};

// ✅ FIX: Implemented authenticatedUser — checks username & password match
const authenticatedUser = (username, password) => {
  if (!username || !password) return false;
  return users.some(
    (user) => user.username === username && user.password === password
  );
};

// POST /login
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    // ✅ FIX: Was `res.send(401)` (wrong — send() doesn't chain .json()); changed to res.status(401)
    return res.status(401).json({
      success: false,
      message: "Username and password are both required.",
    });
  }

  // ✅ Use authenticatedUser helper instead of inline find
  if (!authenticatedUser(username, password)) {
    return res.status(404).json({
      // ✅ FIX: Corrected typo "sucess" → "success"
      success: false,
      message: "User not found or incorrect credentials.",
    });
  }

  const token = jwt.sign(
    { username }, // ✅ FIX: Don't include password in the JWT payload — security risk
    "secretKey",  // ⚠️  In production, use process.env.JWT_SECRET
    { expiresIn: "1d" }
  );

  // Store in session
  req.session.user = {
    user: username,
    token: token,
  };

  return res.status(200).json({
    message: "Login successful.",
    token: token,
  });
});

// POST /register
regd_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      message: "Please provide both username and password.",
    });
  }

  // ✅ Use isValid to check existence
  if (isValid(username)) {
    return res.status(409).json({
      message: "Username is already registered. Please choose a different one.",
    });
  }

  users.push({ username, password });

  return res.status(201).json({
    message: "User successfully registered. Now you can login.",
  });
});

// PUT /review/:isbn — Add or update a book review (authenticated users only)
regd_users.put("/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;

  // ✅ FIX: Guard against missing session / unauthenticated access
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      message: "Unauthorized. Please log in first.",
    });
  }

  const username = req.session.user.user;

  if (!review) {
    return res.status(400).json({
      message: "Review is required as a query parameter (?review=...).",
    });
  }

  // Find the book by ISBN
  const bookKey = Object.keys(books).find((key) => books[key].isbn === isbn);

  if (!bookKey) {
    return res.status(404).json({
      message: "Book not found with the given ISBN.",
    });
  }

  const book = books[bookKey];

  // ✅ FIX: Ensure reviews array exists on book before using findIndex
  if (!Array.isArray(book.reviews)) {
    book.reviews = [];
  }

  const existingReviewIndex = book.reviews.findIndex(
    (r) => r.username === username
  );

  if (existingReviewIndex !== -1) {
    // Modify existing review
    book.reviews[existingReviewIndex].review = review;
    return res.status(200).json({
      message: "Review updated successfully.",
      review: book.reviews[existingReviewIndex],
    });
  } else {
    // Add new review
    const newReview = { username, review };
    book.reviews.push(newReview);
    return res.status(200).json({
      message: "Review added successfully.",
      review: newReview,
    });
  }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;