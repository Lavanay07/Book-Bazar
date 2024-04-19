const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const http = require("http");
const app = express();
const MongoDBStore = require("connect-mongodb-session")(session);
const port = process.env.PORT || 3000;
const ejs = require("ejs");
const path = require("path");
const Book = require("./models/Book");
const router = express.Router();
const socketIO = require("socket.io");
const formatMessage = require("./utils/chatMessage");
const mongoClient = require("mongodb").MongoClient;

const dbname = "Bookstore1";
const chatCollection = "chats";
const userCollection = "onlineUsers";
const server = http.createServer(app);
const io = socketIO(server);
const database = "mongodb://127.0.0.1:27017/";
const User = require("./models/User");
const Rating = require("./models/Ratings");

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

const store = new MongoDBStore({
  uri: "mongodb://127.0.0.1:27017/SessionStore",
  collection: "sessions",
});

store.on("error", (error) => {
  console.error("Session store error:", error);
});

app.use(
  session({
    secret: "konr fuuw tfla pmoj",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

app.use(express.static("public"));
app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const authRouter = require("./routes/auth");
const bookRoutes = require("./routes/books");

app.use("/auth", authRouter);
app.use("/books", bookRoutes);

let showDropdown;

app.get("/", async (req, res) => {
  const user = req.session.user;
  try {
    let books;
    let ratings;

    // Fetch books from the database
    if (user) {
      books = await Book.find({}).exec();
      showDropdown = true;
    } else {
      books = await Book.find({}).exec();
      showDropdown = false;
    }

    ratings = await Rating.find({}).exec();

    // Render the index.ejs template with the fetched data
    res.render("index", { user, books, ratings, showDropdown });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.get("/add_book", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "add_book.html"));
});

app.get("/get-user", (req, res) => {
  // console.log("Sesssion user:", req.session.user);
  if (req.session.user) {
    res.send({ user: req.session.user });
  } else {
    res.send({ user: null });
  }
});

app.get("/bookDetails", async (req, res) => {
  const bookId = req.query.id;
  const user = req.session.user;
  try {
    const book = await Book.findById(bookId);
    if (book) {
      res.render("bookDetails", { book, showDropdown, user });
    } else {
      res.status(404).send("Book not found");
    }
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

app.get("/search", async (req, res) => {
  const user = req.session.user;
  const query = req.query.q;
  try {
    const results = await Book.find({
      $or: [
        { title: { $regex: new RegExp(query, "i") } },
        { author: { $regex: new RegExp(query, "i") } },
      ],
    }).exec();
    res.render("searchResults", { results, query, showDropdown, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/userprofile", (req, res) => {
  const userId = req.session.user._id;
  // console.log(req.session.user._id);
  User.findById(userId)
    .then((user) => {
      if (user) {
        // console.log(user);
        res.render("userprofile", { user });
      } else {
        // console.error("dd");
        res.status(404).send("User not found");
      }
    })
    .catch((error) => {
      // console.error(error);
      res.status(500).send("Internal Server Error");
    });
});

app.get("/reset-password", (req, res) => {
  res.render("reset-password");
});

app.post("/reset-password", async (req, res) => {
  const userId = req.session.user._id;
  const newPassword = req.body.newPassword;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    res.status(200).send("Password reset successful!");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/books/owner/:bookId", async (req, res) => {
  const bookId = req.params.bookId;
  try {
    // Fetch book details from MongoDB
    const book = await Book.findById(bookId).exec();
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    const owner = {
      name: book.user,
    };
    res.json({ owner });
  } catch (error) {
    console.error("Error fetching owner details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Add this route to handle star rating submissions
// API endpoint to fetch user's rating for a book
app.get("/user-rating-review", async (req, res) => {
  try {
    const userId = req.session.user._id;
    const bookId = req.query.bookId;
    const ratingReview = await Rating.findOne({
      userId: userId,
      bookId: bookId,
    }).select("rating review");
    res.json({
      rating: ratingReview ? ratingReview.rating : null,
      review: ratingReview ? ratingReview.review : null,
    });
  } catch (error) {
    console.error("Error fetching user rating and review:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API endpoint to submit rating and review for a book
app.post("/submit-rating-review", async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { bookId, rating, review, bookimg, name } = req.body;

    // Check if the user has already rated and reviewed the book
    const existingRatingReview = await Rating.findOne({
      userId: userId,
      bookId: bookId,
    });
    if (existingRatingReview) {
      return res
        .status(400)
        .json({ error: "You have already rated and reviewed this book" });
    }

    // Create a new Rating document
    const newRatingReview = new Rating({
      userId: userId,
      bookId: bookId,
      rating: rating,
      review: review,
      bookimg: bookimg,
      username: name,
    });

    // Save the new rating and review to the database
    await newRatingReview.save();

    res.status(200).json({
      success: true,
      message: "Rating and review submitted successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Function to handle MongoDB connection
function connectToMongo(callback) {
  mongoClient.connect(database, (err, client) => {
    if (err) {
      console.error("Failed to connect to MongoDB:", err);
      return;
    }
    const db = client.db(dbname);
    const onlineUsers = db.collection(userCollection);
    const chat = db.collection(chatCollection);
    callback(client, db, onlineUsers, chat);
  });
}

io.on("connection", (socket) => {
  // console.log("New User Logged In with ID " + socket.id);
  // console.log("here33");
  socket.on("chatMessage", async (data) => {
    // console.log("here34");
    const dataElement = formatMessage(data);
    // console.log(dataElement);
    // console.log(data.toUser);
    connectToMongo((client, db, onlineUsers, chat) => {
      chat.insertOne(dataElement, (err, res) => {
        if (err) {
          console.error("Failed to insert message into database:", err);
          client.close();
          return;
        }
        socket.emit("message", dataElement);
        // console.log(data.toUser);
        // console.log(onlineUsers);
        // const ele = onlineUsers.findOne({ name: data.toUser });
        // console.log("ELE");
        // console.log(ele);
        onlineUsers.findOne({ name: data.toUser }, (err, res) => {
          // console.log("ressss", res);
          if (err) {
            console.error("Failed to find online user:", err);
            client.close();
            return;
          }
          if (res != null) {
            // console.log(res);
            // location.reload();
            socket.to(res.ID).emit("message", dataElement);
            // location.reload();
          }
        });
        // client.close();
      });
    });
  });

  socket.on("userDetails", async (data) => {
    connectToMongo((client, db, onlineUsers, currentCollection) => {
      // const id = data.bookId;
      const onlineUser = {
        ID: socket.id,
        name: data.fromUser,
      };
      onlineUsers.insertOne(onlineUser, (err, res) => {
        if (err) {
          console.error("Failed to insert online user:", err);
          client.close();
          return;
        }
        console.log(onlineUser.name + " is online...");
        currentCollection
          .find(
            {
              // from: { $in: [data.fromUser, data.toUser] },
              // to: { $in: [data.fromUser, data.toUser] },
              bookId: { $in: [data.bookId, data.bookId] },
            },
            { projection: { _id: 0 } }
          )
          .toArray((err, res) => {
            if (err) {
              console.error("Failed to find chat history:", err);
              client.close();
              return;
            }
            socket.emit("output", res);
            client.close();
          });
      });
    });
  });

  //   const userID = socket.id;
  //   socket.on("disconnect", () => {
  //     connectToMongo((client, db, onlineUsers) => {
  //       const myquery = { ID: userID };
  //       onlineUsers.deleteOne(myquery, (err, res) => {
  //         if (err) {
  //           console.error("Failed to delete offline user:", err);
  //           client.close();
  //           return;
  //         }
  //         // console.log("User " + userID + " went offline...");
  //         client.close();
  //       });
  //     });
  //   });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
