
const getUserByEmail = function(email, users) {
  console.log("email:", email, "users:", users);
  for (const user in users) {
    if (email === users[user].email) {
      return users[user];
    }
  }
  return undefined;
};


const generateRandomString = function() {
  return Math.random().toString(36).substring(2, 8);
};

const urlsForUser = function(userID, urlDatabase) {
  const userURLs = {};
  for (let shortURL in urlDatabase) {
    // console.log("User urls", id);
    if (urlDatabase[shortURL].userID === userID) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
};

module.exports = {getUserByEmail, generateRandomString, urlsForUser};

