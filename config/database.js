
const mongoose = require("mongoose");
const {MONGO_URI} = process.env;

exports.connect = ()=>{
    mongoose.connect(MONGO_URI,
        (err) => {
            if (err)
                throw err;
            console.log('connected to MongoDB');
            
        });
    
}