
function getUserByEmail(email, users) {  
  console.log("email:", email, "users:", users);
  for (const user in users) {
    if (email === users[user].email) {
      return users[user];
    }
  }
  return undefined;
};

module.exports = {getUserByEmail};

