import mongoose from "mongoose";
import connectDB from "./db/index.js";
import dotenv from "dotenv"
import express from "express";
import { app } from "./app.js";

connectDB()
.then(()=>{
    app.listen(process.env.PORT||8000,()=>{
        console.log(`Server is running at port : ${process.env.PORT} `)
    })
    app.on("error", (error) => {
        console.log("Error : ", error);
        throw error
    })
}) 
.catch((error)=>{
    console.log("MongoDB connection Failed !!! ",error)
})

dotenv.config({path : './.env'});



/* One more way to connect database 
import { DB_NAME } from "./constants";
import express from "express";

const app = express()

    ; (async () => {
        try {
            await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
            app.on("error", (error) => {
                console.log("Error : ", error);
                throw error
            })

            app.listen(process.env.PORT, () => {
                console.log(`App is listening on port : ${process.env.PORT}`);
            })

        } catch (error) {
            console.log("ERROR: ", error)
            throw error
        }
    })()*/
// require('dotenv').config({path : './env'})





