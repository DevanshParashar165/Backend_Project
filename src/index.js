import mongoose from "mongoose";
import connectDB from "./db/index.js";
import dotenv from "dotenv"

connectDB();


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

dotenv.config({path : './env'});




