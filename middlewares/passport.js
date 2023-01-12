// @ts-nocheck
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const {
  consoleLogger,
  errorLogger,
} = require("../logger/logger")

const UsersDao = require('../model/daos/Users.dao');
const { formatUserForDB } = require('../utils/users.utils');

const User = new UsersDao();
UsersDao.connect()

const salt = () => bcrypt.genSaltSync(10);
const createHash = (password) => bcrypt.hashSync(password, salt());
const isValidPassword = (user, password) => bcrypt.compareSync(password, user.password);

// Passport Local Strategy

// sign up
passport.use('signup', new LocalStrategy(
  async (username, password, done) => {
  try {
    const userItem = {
      username: username,
      password: createHash(password)
    };
    const newUser = formatUserForDB(userItem);
    const user = await User.createUser(newUser);
    consoleLogger.info("User registration successfull");
    return done(null, user);
  }
  catch(error) {
    errorLogger.error("Error signuping user up...");
    errorLogger.error(err);
    return done(error);
  }
}));

// sign in
passport.use('signin', new LocalStrategy( async (username, password, done) => {
  try {
    const user = await User.getByEmail(username);
    if (!isValidPassword(user, password)) {
      errorLogger.error("Invalid user or password");
      return done(null, false);
    }
    return done(null, user);
  }
  catch(error) {
    errorLogger.error("Error signing in...");
    return done(error);
  }
}))

// Serialization
passport.serializeUser((user, done) => {
  done(null, user._id);
})

// Deserialization
passport.deserializeUser(async (id, done) => {
  const user = await User.getById(id);
  done(null, user);
})

module.exports = passport;