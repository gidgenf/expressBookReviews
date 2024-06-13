const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => {
  const user = users.find((user) => user.username === username);
  return !!user;
}

const authenticatedUser = (username, password) => {
  const validUser = users.find(
    (user) => user.username === username && user.password === password
  );

  return !!validUser;
}

regd_users.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(404).json({ message: "Error logging in" });
  }

  if (authenticatedUser(username, password)) {

    let accessToken = jwt.sign({ data: password }, 'access', { expiresIn: 60 * 60 });

    req.session.authorization = { accessToken, username }

    return res.status(200).json({ message: "User successfully logged in", accessToken });
  } else {
    return res.status(208).json({ message: "Invalid Login. Check username and password" });
  }
});

regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.body.review;
  const username = req.session.authorization.username;

  if (!req.session.authorization || !req.session.authorization.accessToken) {
    return res.status(401).json({ message: "Unauthorized. Missing access token" });
  }

  jwt.verify(req.session.authorization.accessToken, "access", (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized. Invalid access token" });
    }

    books[isbn].reviews[username] = review;
    return res.status(200).json({ message: "Review added successfully", reviews: books[isbn].reviews });
  });
});

regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session.authorization.username;

  if (isbn in books) {
    if (books[isbn].reviews && books[isbn].reviews[username]) {

      let deletedReview = books[isbn].reviews[username]
      delete books[isbn].reviews[username];
      res.status(200).send("'" + deletedReview + "'" + " Review deleted successfully.");
    } else {
      res.status(404).json({ message: "Review not found." });
    }
  } else {
    res.status(404).json({ message: "Book not found." });
  }
});


module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
