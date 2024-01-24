require("dotenv").config();

var createError = require("http-errors");
var express = require("express");
const cors = require("cors");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

// var indexRouter = require("./routes/reader_Route");
var userRouter = require("./routes/userRoute");

var app = express();

const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const mongoDB = process.env.mongoCon;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connecion error: "));

app.use("/uploads", express.static("uploads"));

// Enable CORS for all routes
// app.use(cors());
const allowedOrigins = [process.env.FRONT1, process.env.FRONT2];

// Use CORS middleware with the specific origin
// app.use(
//   cors({
//     origin: "http://localhost:5173",
//     credentials: true,
//   })
// );

app.use(
  cors({
    origin: function (origin, callback) {
      // Check if the origin is in the allowed list or if it's not defined (e.g., a same-origin request)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Additional headers to set for cookies
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// view engine setup
// new
// app.set("views", path.join(__dirname, "views"));
// app.set("view engine", "ejs");
// new

app.use(logger("dev"));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// Following changes allow file uploads upto 2mb
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ limit: "2mb", extended: true, parameterLimit: 5000 }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api", userRouter);
// app.use("/authorAPI", authorsRouter);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500).json({ message: res.locals.message });
  // res.render("error");
  // res.json({ message: message, status: err.status, stack: err.stack });

  // res.status(err.status || 500);
  // res.render("error", { title: "Error!" });
});

module.exports = app;
