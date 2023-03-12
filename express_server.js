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

function getUserEmail(email) {
  for (const user in users) {
    if (email === users[user].email) {
      return true;
    }
  }
  return false;
};

function getUserPassword(password) {
  for (const user in users) {
    if (password === users[user].password) {
      return true;
    }
  }
  return false;
};

function getUserByEmail(email) {
  for (const user in users) {
    if (email === users[user].email) {
      return users[user];
    }
  }
  return null;
};

function urlsForUser(user_id, urlDatabase) {
  userURLs = {};
  for (let shortURL in urlDatabase) {    
    // console.log("User urls", id);
    if (urlDatabase[shortURL].userID === user_id) {  
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
};

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

  okw3ep: {
    longURL: "www.canada.ca",
    userID: "user3RandomID",
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
};

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/register", (req,res) => {
  const user = users[req.cookies["user_id"]];
  if (user) {
    res.redirect("/urls");
  } else {
    const templateVars = {user: user, email: req.body.email, password:req.body.password};
    res.render("register", templateVars);  
  }
});

app.post('/register', function(req, res) {
  if (!req.body.password || !req.body.email) {
    return res.status(400).send("Your email or password is invalid. Please try again!");
  };  
  if (getUserByEmail(req.body.email)) {
    res.status(400).send("Your email is already registered. Try logging in instead!");
    return;
  }; 
  const id = generateRandomString();  
  const user = {id: id, email: req.body.email, password:req.body.password}; 
  users[id] = user;
  res.cookie("user_id", id);
  console.log(users);
  res.redirect("/urls");  
});


app.get("/urls", (req, res) => {
  const user = users[req.cookies["user_id"]];  
  if (!user) {
    return res.send("Please login to view your short URLs.");
  } else {
    let templateVars = {user: user, urls: urlsForUser(user.id, urlDatabase)};    
    res.render("urls_index", templateVars);
  }
});


app.post("/urls", (req, res) => {
  const userID = req.cookies["user_id"]  
  if (!userID) {
    return res.send("Sorry, you cannot create a link unless you are a registered user");
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
  const user = users[req.cookies["user_id"]];  
  const templateVars = {user:user, email: req.body.email, password: req.body.password};
  if (user) {
    res.redirect("/urls");    
  } else {
    res.render("login", templateVars);
  }
});


app.post("/login", (req, res) => {  
  const user = getUserByEmail(req.body.email);   
  if (!user) {
    res.status(403).send("Email not found.");
  } else if (user.password !== req.body.password) {
    res.status(403).send("Password is incorrect.");
  } else {    
    res.cookie("user_id", user.id);  
    res.redirect("/urls");
  }
});


app.post("/logout", (req, res) => {  
  // req.session = null;
  res.clearCookie("user_id");
  res.redirect("/login");  
});


//Redirect short URL to equivalent long URL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  
  // If short URL is not available in database, warn user with a message
  if (!longURL) {
    return res.send("Sorry, the URL requested does not exist.");
  } else {
    res.redirect(longURL);
  }
});

//Add route for a form to create a new shortened URL
app.get("/urls/new", (req, res) => {  
  const user = users[req.cookies["user_id"]]; // Get user from user database

  // A user that is not logged in will be redirected to the login page
  if (!user) {
    return res.redirect("/login");
  } else {
  const templateVars = {user: user};  
  res.render("urls_new", templateVars);
  }
});

// Displays edit form for a requested URL
app.get("/urls/:id", (req, res) => {
  const shortID = req.params.id;
  const longURL = urlDatabase[shortID].longURL;  
  const userID = req.cookies["user_id"];
  const user = users[userID];
  const templateVars = {id: shortID, longURL, user};

  

  //GET /urls/:id page returns a relevant error message to the user if they are not logged in.
  if (!userID) {
    res.send("You need to be a registered user to view the long URL for the short URL you entered.");
  } 
  // GET /urls/:id page returns a relevant error message to the user if they do not own the URL.
  else if (userID !== urlDatabase[shortID].userID) {
    res.send("Sorry, you are only allowed to see your own short URLs.");
  } else {
    res.render("urls_show", templateVars); 
  }
});

// Editing a URL on urls_index page redirects to the urls_show page
app.post("/urls/:id", (req, res) => {  
  const shortID = req.params.id;  
  const userId = req.cookies["user_id"];
  

  if (!(shortID in urlDatabase)) {   
      return res.status(400).send("Sorry, the requested short URL does not exist.");
    }   
  
  
  // This also covers the case where user is not logged in
  if (userId !== urlDatabase[shortID].userID) {
    return res.status(400).send("Sorry, you are not allowed to modify other users' URLs.")
  }
  
  urlDatabase[req.params.id] = req.body.url;  
  res.redirect("/urls");
});


app.post("/urls/:id/delete", (req, res) => {
  const shortID = req.params.id;   
  const userID = req.cookies["user_id"];
  

  if (!(shortID in urlDatabase)) {   
    return res.status(400).send("Sorry, you can only delete existing URLs.");
  }  

  if (!userID) {
    res.status(400).send("Sorry, only logged in users are allowed to delete URLs.");
  } else if (userID !== urlDatabase[shortID].userID) {
    res.status(400).send("Sorry, you are not allowed to delete other users' URLs.")
  } else {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  }
});









app.listen(PORT, () => {
  console.log(`Example app listening on port${PORT}`);
});



