require("dotenv").config();

var createError = require("http-errors");
var express = require("express");
const cors = require("cors");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const mongoose = require("mongoose");

mongoose.set("strictQuery", false);
const mongoDB = process.env.mongoCon;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connecion error: "));

var indexRouter = require("./routes/index");
var authorsRouter = require("./routes/authors_Route");

var app = express();

// Enable CORS for all routes
// app.use(cors());

// Use CORS middleware with the specific origin
app.use(
  cors({
    origin: "http://localhost:5173",
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
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/blogs", indexRouter);
app.use("/authorAPI", authorsRouter);
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
