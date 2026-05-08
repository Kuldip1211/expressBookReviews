const express = require('express');
const axios = require('axios');

let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;

const public_users = express.Router();


// Register New User
public_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  const userExists = users.find((user) => user.username === username);
  if (userExists) {
    return res.status(409).json({ message: "User already exists" });
  }

  users.push({ username, password });
  return res.status(201).json({ message: "User registered successfully" });
});


// Task 1: Get all books using Promise callback
public_users.get('/', function (req, res) {
  new Promise((resolve, reject) => {
    if (books) {
      resolve(books);
    } else {
      reject(new Error("No books found"));
    }
  })
  .then((data) => {
    res.status(200).json(data);
  })
  .catch((err) => {
    res.status(500).json({ message: err.message });
  });
});


// Task 2: Get book by ISBN using async/await with Axios
public_users.get('/isbn/:isbn', async function (req, res) {
  try {
    const response = await axios.get('http://localhost:5000/');
    const allBooks = Object.values(response.data);
    const book = allBooks.find((b) => b.isbn === req.params.isbn);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    return res.status(200).json(book);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});


// Task 3: Get books by Author using async/await with Axios
public_users.get('/author/:author', async function (req, res) {
  try {
    const response = await axios.get('http://localhost:5000/');
    const allBooks = Object.values(response.data);
    const filtered = allBooks.filter((b) =>
      b.author && b.author.toLowerCase().includes(req.params.author.toLowerCase())
    );

    if (filtered.length === 0) {
      return res.status(404).json({ message: "No books found for this author" });
    }
    return res.status(200).json(filtered);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});


// Task 4: Get books by Title using async/await with Axios
public_users.get('/title/:title', async function (req, res) {
  try {
    const response = await axios.get('http://localhost:5000/');
    const allBooks = Object.values(response.data);
    const filtered = allBooks.filter((b) =>
      b.title && b.title.toLowerCase().includes(req.params.title.toLowerCase())
    );

    if (filtered.length === 0) {
      return res.status(404).json({ message: "No books found for this title" });
    }
    return res.status(200).json(filtered);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});


// Get book reviews
public_users.get('/review/:isbn', async function (req, res) {
  try {
    const response = await axios.get('http://localhost:5000/');
    const allBooks = Object.values(response.data);
    const book = allBooks.find((b) => b.isbn === req.params.isbn);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    return res.status(200).json(book.reviews);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});


module.exports.general = public_users;