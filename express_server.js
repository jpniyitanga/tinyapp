const express = require('express');
// const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const { application, request } = require('express');
const bcrypt = require("bcryptjs");
const {getUserByEmail, generateRandomString, urlsForUser} = require('./helpers');


const app = express();
const PORT = 8080;
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true })); // To parse data from POST

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

const urlDatabase = {

  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "user2RandomID"
  },

  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID"
  },

  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },

  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },

  o3yrra: {
    longURL: "www.canada.ca",
    userID: "o3yrra",
  }
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
  user3RandomID: {
    id: "user3RandomID",
    email: "jean@yahoo.com",
    password: "123",
  },

  o3yrra: {
    id: 'o3yrra',
    email: '123@abc.com',
    password: '$2a$10$.cIWUxwxAbmlnTS1d/AT9egpZiLORprinCMyGRWTCCfTbSaT.0MhS'
  },
};

app.get('/', (req, res) => {
  const user = users[req.session.userID];
  if (user) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/register", (req,res) => {
  const user = users[req.session.userID];
  if (user) {
    res.redirect("/urls");
  } else {
    const templateVars = {user: user, email: req.body.email, password:req.body.password};
    res.render("register", templateVars);
  }
});

app.post('/register', function(req, res) {
  if (!req.body.password || !req.body.email) {
    res.status(400).send("Your email or password is invalid. Please try again!");
    return;
  }
  if (getUserByEmail(req.body.email, users)) {
    res.status(400).send("Your email is already registered. Try logging in instead!");
    return;
  }
  const id = generateRandomString();
  const email = req.body.email;
  const password = bcrypt.hashSync(req.body.password, 10);
  const user = {id, email, password};
  users[id] = user;
  req.session.userID = user.id;
  console.log(users);
  res.redirect("/urls");
});


app.get("/urls", (req, res) => {
  const userID = req.session.userID;
  if (!userID) {
    res.send("Please login to view your short URLs.");
    return;
  } else {
    let templateVars = {user: users[userID], urls: urlsForUser(userID, urlDatabase)};
    res.render("urls_index", templateVars);
  }
});


app.post("/urls", (req, res) => {
  const userID = req.session.userID;
  if (!userID) {
    res.send("Sorry, you cannot create a link unless you are a registered user.");
    return;
  } else {
    const shortID = generateRandomString();
    urlDatabase[shortID] = {
      longURL: req.body.longURL,
      userID
    };
    console.log(req.body); // Log the POST request body to the console
    res.redirect(`/urls/${shortID}`); // Respond with new short URL
  }
});



app.get("/login", (req, res) => {
  const userID = req.session.userID;
  const templateVars = {user:users[userID], email: req.body.email, password: req.body.password};
  if (userID) {
    res.redirect("/urls");
  } else {
    res.render("login", templateVars);
  }
});


app.post("/login", (req, res) => {
  const inPuttedEmail = req.body.email;
  const inPuttedPassword =  req.body.password;
  const user = getUserByEmail(inPuttedEmail, users);
  console.log(user);
  let userEmail;
  let userPassword;
  if (user) {
    userEmail = user.email;
    userPassword = user.password;
  }
  if (!userEmail) {
    res.send("Email not found. Please register!");
    return;
  }
  const validation = bcrypt.compareSync(inPuttedPassword, userPassword);
  console.log(validation);
  if (!validation) {
    res.send("Password is incorrect. Please try again!");
  } else {
    // res.cookie("user_id", user.id);
    req.session.userID = user.id;
    res.redirect("/urls");
  }
});


app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});


//Redirect short URL to equivalent long URL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  
  // If short URL is not available in database, warn user with a message
  if (!longURL) {
    res.send("Sorry, the URL requested does not exist.");
    return;
  } else {
    res.redirect(longURL);
  }
});

//Add route for a form to create a new shortened URL
app.get("/urls/new", (req, res) => {
  const userID = req.session.userID; // Get user from user database
  // console.log(user)

  // A user that is not logged in will be redirected to the login page
  if (!userID) {
    res.redirect("/login");
    return;
  } else {
    const templateVars = {user: users[userID]};
    res.render("urls_new", templateVars);
  }
});


// Displays edit form for a requested URL
app.get("/urls/:id", (req, res) => {
  const shortID = req.params.id;
  const url = urlDatabase[shortID];
  let longURL;
  if (url) {
    longURL = urlDatabase[shortID].longURL;
  }
  const userID = req.session.userID;
  const user = users[userID];
  const templateVars = {id: shortID, longURL, user};

  //GET /urls/:id page returns a relevant error message to the user if they are not logged in.
  if (!userID) {
    res.send("You need to be a registered user to view the long URL for the short URL you entered.");
    return;
  }
  // GET /urls/:id page returns a relevant error message to the user if they do not own the URL.
  const userData = urlDatabase[shortID];
  let dUserID;
  if (userData) {
    dUserID = userData.userID;
    console.log({userID, dUserID});
  }
  
  if (userID !== dUserID) {
    res.send("Sorry, you are only allowed to see your own short URLs.");
  } else {
    res.render("urls_show", templateVars);
  }
});

// Editing a URL on urls_index page redirects to the urls_show page
app.post("/urls/:id", (req, res) => {
  const shortID = req.params.id;
  const userId = req.session.userID;

  if (!(shortID in urlDatabase)) {
    res.send("Sorry, the requested short URL does not exist.");
    return;
  }
  
  // This also covers the case where user is not logged in
  if (userId !== urlDatabase[shortID].userID) {
    res.send("Sorry, you are not allowed to modify other users' URLs.");
    
  } else {
    urlDatabase[shortID].longURL = req.body.url;
    res.redirect("/urls");
  }
});


app.post("/urls/:id/delete", (req, res) => {
  const shortID = req.params.id;
  const userID = req.session.userID;

  if (!(shortID in urlDatabase)) {
    return res.send("Sorry, you can only delete existing URLs.");
  }

  if (!userID) {
    res.send("Sorry, only logged in users are allowed to delete URLs.");
  } else if (userID !== urlDatabase[shortID].userID) {
    res.send("Sorry, you are not allowed to delete other users' URLs.");
  } else {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  }
});




app.listen(PORT, () => {
  console.log(`Example app listening on port${PORT}`);
});



