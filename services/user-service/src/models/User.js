class User {
  constructor(username) {
    this.userId = require('crypto').randomUUID();
    this.username = username;
    this.gamesPlayed = 0;
    this.gamesWon = 0;
    this.createdAt = new Date();
  }
}

module.exports = User;