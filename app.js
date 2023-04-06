const User = require('./models/User')
const express = require("express");
const connectDB = require('./db/connect');
const bcrypt = require('bcryptjs');

const path = require("path");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
require('dotenv').config();

const MongoDBStore = require('connect-mongodb-session')(session);

var store = new MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: 'sessions'
});

// Catch errors
store.on('error', function (error) {
  console.log(error);
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));

const app = express();
app.set("views", __dirname);
app.set("view engine", "ejs");

app.use(session({
  secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: true,
  store: store
}));

// This code below from CTD generates an error MongooseError: Model.findOne() no longer accepts a callback at Function
// https://stackoverflow.com/questions/75649330/mongooseerror-model-findone-no-longer-accepts-a-callback-at-function#:~:text=findOne()%20method%20no%20longer,.%2F..%2FSchemas.

// passport.use(
//   new LocalStrategy((username, password, done) => {
//     User.findOne({ username: username }, (err, user) => {
//       if (err) {
//         return done(err);
//       }
//       if (!user) {
//         return done(null, false, { message: "Incorrect username" });
//       }
//       bcrypt.compare(password, user.password, (err, result) => {
//         if (result) {
//           return done(null, user);
//         } else {
//           return done(null, false, { message: "Incorrect password" });
//         }
//       });
//       // return done(null, user);
//     });
//   })
// );

passport.use(
  new LocalStrategy(async(username, password, done) => {
    try {
      const user = await User.findOne({ username: username });
      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      };
      bcrypt.compare(password, user.password, (err, result) => {
        if (result) {
          return done(null, user);
        } else {
          return done(null, false, { message: "Incorrect password" });
        }
      });
    } catch(err) {
      return done(err);
    };
  })
);


passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function(id, done) {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch(err) {
    done(err);
  };
});

app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

// makes it so that we don't have to specify req.user in the code below, and just reference currentUser in index.ejs

app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  next();
});

const authMiddleware = (req, res, next) => {
  if (!req.user) {
    if (!req.session.messages) {
      req.session.messages = [];
    }
    req.session.messages.push("You can't access that page before logon.");
    res.redirect('/');
  } else {
    next();
  }
}

app.get("/", (req, res) => {
  let messages = [];
  if (req.session.messages) {
    messages = req.session.messages;
    req.session.messages = [];
  }
  res.render("index", { messages });
});

app.get("/sign-up", (req, res) => res.render("sign-up-form"));
app.post("/sign-up", async (req, res, next) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    await User.create({ 
      username: req.body.username, 
      password: hashedPassword})
    res.redirect("/");
  } catch (err) {
    return next(err);
  }
});

app.post(
  "/log-in",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/",
    failureMessage: true
  })
);

app.get('/restricted', authMiddleware, (req, res) => {
  if (!req.session.pageCount) {
    req.session.pageCount = 1;
  } else {
    req.session.pageCount++;
  }
  res.render('restricted', { pageCount: req.session.pageCount });
})

app.get("/log-out", (req, res) => {
  req.session.destroy(function (err) {
    res.redirect("/");
  });
});



// Catch errors
store.on('error', function (error) {
  console.log(error);
});


const port = process.env.PORT || 3000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();