const users = new Map();

class UserModel {
  static create(username) {
    const user = {
      id: require('crypto').randomUUID(),
      username,
      gamesPlayed: 0,
      gamesWon: 0,
      createdAt: new Date().toISOString()
    };
    
    users.set(user.id, user);
    return user;
  }

  static findById(userId) {
    return users.get(userId);
  }

  static findByUsername(username) {
    return Array.from(users.values()).find(user => user.username === username);
  }

  static updateStats(userId, won) {
    const user = users.get(userId);
    if (user) {
      user.gamesPlayed += 1;
      if (won) user.gamesWon += 1;
      return user;
    }
    return null;
  }

  static getAll() {
    return Array.from(users.values());
  }

  static exists(username) {
    return Array.from(users.values()).some(user => user.username === username);
  }
}

module.exports = UserModel;
