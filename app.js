if(process.env.NODE_ENV !="production"){
    require('dotenv').config();  
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override")
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");

const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const dbUrl = process.env.ATLASDB_URL;

// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

// establishing mongoDB database connection to our JS through mongoose npm package
main().then(() =>{
    console.log("connected to DB")
})
.catch((err) =>{
    console.log(err);
})
 
async function main(){
    await mongoose.connect(dbUrl);
}



app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.urlencoded ({extended: true}));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24*3600
});

store.on("error", () =>{
    console.log("ERROR in MONGO SESSION STORE", err);
})

const sessionOption = {
    store,
    secret: "mysupersecretstring",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7*24*60*60*1000,
        maxAge: 7*24*60*60*1000,
        httpOnly: true
    }
}
// app.get("/",(req, res) =>{
//     res.send("Hi, I am Root")
// })




app.use(session(sessionOption));
app.use(flash());

// to implement passport we need session

app.use(passport.initialize()); 
app.use(passport.session());    //A web appplication needs the ability to identify users a sthey browse from page to page. This series of requests and responses, each  associated with the same user, is known as a session.

passport.use(new LocalStrategy(User.authenticate()));       //use static authenticate method of model in LocalStrategy
// authenticate() generates a function that is used by passport's LocalStrategy


passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) =>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// app.get("/demouser", async (req, res) =>{
//     let fakeUser = new User({
//         email: "student@gmail.com",
//         username: "delta-student"
//     });
//     let registeredUser = await User.register(fakeUser, "helloworld");  // here helloworld is the password.
//     res.send(registeredUser);

// })




app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// 404 Route
app.all("*", (req,res,next) =>{
    next(new ExpressError(404, "Page Not Found!"));
});

app.use((err,req,res,next) =>{
    let {statusCode=500, message="Something went wrong!"} = err;
    if (!res.headersSent) {
        res.status(statusCode);
        res.render("error.ejs", { message });
    } else {
        next(err);
    }
})

app.listen(8080, () =>{
    console.log("Server is listening to port 8080");
})