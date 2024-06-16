const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

// establishing mongoDB database connection to our JS through mongoose npm package
main().then(() =>{
    console.log("connected to DB")
})
.catch((err) =>{
    console.log(err);
})
 
async function main(){
    await mongoose.connect(MONGO_URL);
}

const initDB = async () =>{
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj) =>({...obj, owner: "666b2998d1b7fa34b98e4ebd"}))
    await Listing.insertMany(initData.data);
    console.log("data was initialized");
}

initDB();