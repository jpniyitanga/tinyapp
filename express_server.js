const express = require('express');
const cookieParser = require('cookie-parser');
const { application, request } = require('express');

const app = express();
const PORT = 8080;
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true })); // To parse data from POST
app.use(cookieParser());

function  generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/register", (req,res) => {
  const templateVars = {username: req.cookies["username"], email: req.body.email, password:req.body.password};
  res.render("register", templateVars);
});

app.post('/register', function(req, res) {
  const {email, password} = req.body;
  const id = generateRandomString();
  const user = {id, email, password}; 
  users[id] = user;
  res.cookie("user_id", id);
  console.log(users);
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  const shortID = generateRandomString();
  urlDatabase[shortID] = req.body.longURL;
  console.log(req.body); // Log the POST request body to the console
  res.redirect(`/urls/${shortID}`); // Respond with new short URL
});

app.get("/urls", (req, res) => {
  const templateVars = {username: req.cookies["username"], urls: urlDatabase};
  res.render("urls_index", templateVars);
});

app.post("/login", (req, res) => {  
  res.cookie("username", req.body.username);  
  res.redirect("/urls");
});


app.post("/logout", (req, res) => {  
  // req.session = null;
  res.clearCookie("username");
  res.redirect("/urls");  
});


//Redirect shortened URLs to original URL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

//Add route to display a new form
app.get("/urls/new", (req, res) => {
  const templateVars = {username: req.cookies["username"]};
  res.render("urls_new", templateVars);
});

// Display a URL on urls_index page
app.get("/urls/:id", (req, res) => {
  const templateVars = {id: req.params.id, longURL: urlDatabase[req.params.id], username: req.cookies["username"]};
  res.render("urls_show", templateVars);  
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// Editing a URL on urls_index page redirects to the urls_show page
app.post("/urls/:id", (req, res) => {  
  urlDatabase[req.params.id] = req.body.url;  
  res.redirect("/urls");
});







app.listen(PORT, () => {
  console.log(`Example app listening on port${PORT}`);
});



