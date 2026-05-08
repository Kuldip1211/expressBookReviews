const express = require('express');
let books = require("./booksdb.js");
const { default: axios } = require('axios');
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();
let allBooks = JSON.stringify(books);


public_users.post("/register", (req,res) => {
  //Write your code here
  let username = req.body.username;
  let password = req.body.password;
  if(!username || !password){
    return res.send("Both username and password are necessary for registeration!");
  }
  users.forEach((user)=>{
    if(user.username === username){
      return res.send("This user already exists ");
    }
  });
  users.push({"username":username,"password":password});
  return res.status(200).send(`User ${username} is successfully registered `);
});

// Get the book list available in the shop
// Using Promise callbacks approach
public_users.get('/', function (req, res) {
  axios.get("http://localhost:5000/")
    .then((response) => {
      res.status(200).json(response.data);
    })
    .catch((error) => {
      res.status(500).json({ 
        error: "Failed to fetch books", 
        message: error.message 
      });
    });
});

// Get book details based on ISBN
// Using async/await approach
public_users.get('/isbn/:isbn', async function (req, res) {
  try {
    const isbn = req.params.isbn;
    const response = await axios.get("http://localhost:5000/");
    const allBooks = response.data;
    
    // Search for book with matching ISBN
    let foundBook = null;
    for (const bookId in allBooks) {
      if (allBooks[bookId].isbn === isbn) {
        foundBook = allBooks[bookId];
        break;
      }
    }
    
    if (foundBook) {
      res.status(200).json(foundBook);
    } else {
      res.status(404).json({ error: "Book with ISBN not found" });
    }
  } catch (error) {
    res.status(500).json({ 
      error: "Failed to fetch book by ISBN", 
      message: error.message 
    });
  }
});
  
// Get book details based on author
// Using Promise chaining with advanced error handling
public_users.get('/author/:author', function (req, res) {
  const authorName = req.params.author;
  
  axios.get("http://localhost:5000/")
    .then((response) => {
      const allBooks = response.data;
      const booksArray = Object.values(allBooks);
      
      // Filter books by author (case-insensitive partial match)
      const matchedBooks = booksArray.filter((book) => 
        book.author.toLowerCase().includes(authorName.toLowerCase())
      );
      
      if (matchedBooks.length > 0) {
        res.status(200).json({ 
          count: matchedBooks.length, 
          books: matchedBooks 
        });
      } else {
        res.status(404).json({ 
          error: "No books found for this author", 
          author: authorName 
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ 
        error: "Failed to fetch books by author", 
        message: error.message 
      });
    });
});

// Get all books based on title
// Using async/await with advanced filtering
public_users.get('/title/:title', async function (req, res) {
  try {
    const title = req.params.title;
    const response = await axios.get("http://localhost:5000/");
    
    const allBooks = response.data;
    const booksArray = Object.values(allBooks);
    
    // Filter books by title (case-insensitive partial match)
    const matchedBooks = booksArray.filter((book) =>
      book.title.toLowerCase().includes(title.toLowerCase())
    );
    
    if (matchedBooks.length > 0) {
      res.status(200).json({ 
        count: matchedBooks.length, 
        books: matchedBooks 
      });
    } else {
      res.status(404).json({ 
        error: "No books found with this title", 
        searchedTitle: title 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      error: "Failed to fetch books by title", 
      message: error.message 
    });
  }
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  //Write your code here
  let isbn = req.params.isbn;
  if(books[isbn]){
    res.json(books[isbn].reviews);
  }else{
    res.status(404).send("Book Not found");
  }

});

module.exports.general = public_users;