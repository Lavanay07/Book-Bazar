const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const app = express();
const MongoDBStore = require("connect-mongodb-session")(session);
const port = process.env.PORT || 3000;
const ejs = require("ejs");
const path = require("path");
const Book = require("./models/Book");
// const socketIO = require('socket.io');
const http = require("http");
const server = http.createServer(app);
// const WebSocket = require('ws');
const router = express.Router();
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const multer = require("multer");
const User = require("./models/User");
const socketIO = require("socket.io");
const io = socketIO(server);
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  const currentUser = socket.handshake.session.user || "Anonymous";

  socket.on("chat", (data) => {
    io.emit("chat", {
      buyer: currentUser,
      owner: data.owner,
      message: data.message,
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});
// Database connection setup
mongoose
  .connect("mongodb://127.0.0.1:27017/Bookstore1", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error", err);
  });

// Middleware setup
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(express.json());

// Set up body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));

// Create a new MongoDB session store
const store = new MongoDBStore({
  uri: "mongodb://127.0.0.1:27017/SessionStore", // MongoDB URI for session storage
  collection: "sessions",
});

// Catch errors in the session store
store.on("error", (error) => {
  console.error("Session store error:", error);
});

// Configure session middleware
app.use(
  session({
    secret: "konr fuuw tfla pmoj", // Change this to a secret key for session encryption
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.get("/index", (req, res) => {
  res.render("index"); // Render the index.ejs file
});

// Import the auth router
const authRouter = require("./routes/auth");
const bookRoutes = require("./routes/books");

// Use the authRouter for dashboard and login routes
app.use("/auth", authRouter);
app.use("/books", bookRoutes);
let showDropdown;

app.get("/", (req, res) => {
  const user = req.session.user;
  if (user) {
    Book.find({})
      .exec()
      .then((books) => {
        showDropdown = true;
        res.render("index", { user, books, showDropdown });
      })
      .catch((err) => {
        console.error("Error:", err);
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      });
  } else {
    Book.find({})
      .exec()
      .then((books) => {
        showDropdown = false;
        res.render("index", { user, books, showDropdown });
      })
      .catch((err) => {
        console.error("Error:", err);
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      });
  }
});

app.get("/add_book", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "add_book.html"));
});

app.get("/get-user", (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.json({ user: null });
  }
});

app.get("/bookDetails", async (req, res) => {
  const bookId = req.query.id; // Get the book ID from the query parameter
  const user = req.session.user;
  try {
    const book = await Book.findById(bookId); // Assuming you have an 'id' field in your MongoDB documents
    if (book) {
      res.render("bookDetails", { book, showDropdown, user });
    } else {
      res.status(404).send("Book not found");
    }
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// Add this route to handle search requests
app.get("/search", async (req, res) => {
  const user = req.session.user;
  const query = req.query.q;
  try {
    const results = await Book.find({
      $or: [
        { title: { $regex: new RegExp(query, "i") } },
        { author: { $regex: new RegExp(query, "i") } },
      ],
    });
    res.render("searchResults", { results, query, showDropdown, user }); // Pass results to the view
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/userprofile", (req, res) => {
  const userId = req.session.user._id; // Assuming you store user ID in the session

  // Fetch user details from the database
  User.findById(userId)
    // const user = await User.findById(id)
    .then((user) => {
      if (user) {
        res.render("userprofile", { user });
      } else {
        res.status(404).send("User not found");
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Internal Server Error");
    });
});

app.get("/reset-password", (req, res) => {
  // Render the password reset form
  res.render("reset-password");
});

app.post("/reset-password", async (req, res) => {
  const userId = req.session.user._id; // Assuming you store user ID in the session
  const newPassword = req.body.newPassword;

  try {
    // Fetch user from the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    user.password = hashedPassword;
    await user.save();

    // Respond to the client
    res.status(200).send("Password reset successful!");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
