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
public_users.get('/', async function (req, res) {
  //Write your code here
  try{
    res.send(books);
  }catch(err){
    res.send(err);
  }
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn',async function (req, res) {
  //Write your code here
  let isbn = req.params.isbn;
  await axios.get("http://localhost:5000/")
  .then((result)=>{
    res.json(result.data[isbn]);
  })
  .catch((err)=>{
    res.send(err);
  })
  
 });
  
// Get book details based on author
public_users.get('/author/:author', async function (req, res) {
  //Write your code here
  let authorName = req.params.author;
  await axios.get("http://localhost:5000/")
  .then((result)=>{
    let data = result.data;
    const booksArr = [];
    for (const element in data) {
      booksArr.push(data[element]);
    }
    let books = booksArr.filter((el)=>el.author.includes(authorName));
    if(books.length > 0){
      res.send(books);
    }else{
      res.send("Author does't exists!");
    }
  })
  .catch((err)=>{
    res.send(err);
  })
});

// Get all books based on title
public_users.get('/title/:title', async function (req, res) {
  //Write your code here
    let title = req.params.title;
    await axios.get("http://localhost:5000/")
    .then((data)=>{
      let books = booksArr.filter((el)=>el.title.includes(title));
      res.send(books);
    })
    .catch(err=>{
      {
        res.send("This title doesnot exists! ore there is some error",err);
      }
    })
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