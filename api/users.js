const express = require("express");
const usersRouter = express.Router();
const { getAllUsers, getUserByUsername, createUsers } = require("../db");

const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;
const bcrypt = require("bcrypt");

usersRouter.use((req, res, next) => {
  console.log("/users, come on up!");

  next();
});

usersRouter.get("/", async (req, res) => {
  const users = await getAllUsers();

  res.send({
    users,
  });
});

usersRouter.post("/login", async (req, res, next) => {
  const { username, password } = req.body;
  if (!username || !password) {
    next({
      name: "MissingCredentialError",
      message: "Pls gib both name and password",
    });
  }
  try {
    const user = await getUserByUsername(username);
    const hashedPassword = user.password;
    const match = await bcrypt.compare(password, hashedPassword);

    if (user && match) {
      const token = jwt.sign(
        {
          id: user.id,
          username,
        },
        process.env.JWT_SECRET
      );
      res.send({
        message: "u r logged in!",
        token,
      });
    } else {
      next({
        name: "IncorrectCredentialsError",
        message: "something is wrong here...",
      });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

usersRouter.post("/register", async (req, res, next) => {
  const { username, password, name, location } = req.body;

  try {
    const _user = await getUserByUsername(username);

    if (_user) {
      next({
        name: "UserExistsError",
        message: "that username is taken. think of another one",
      });
    }

    const user = await createUsers({
      username,
      password,
      name,
      location,
    });

    const token = jwt.sign(
      {
        id: user.id,
        username,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1w",
      }
    );

    res.send({
      message: "hey, u signed up! thanks!",
      token,
    });
  } catch ({ name, message }) {
    next({ name, message });
  }
});

module.exports = usersRouter;
