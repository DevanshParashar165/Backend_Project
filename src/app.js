import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}))

//routes


import userRouter from "./routes/user.routes.js"

//routes declarationpoiuyt   

app.use("/api/v1/users",userRouter)

//Data will come from many sources so we need to prepare

app.use(express.json({
    limit : "16kb" // set the data limit to be recieved    
}))
app.use(express.urlencoded({
    extended : true,
    limit :"16kb",
    
}))
app.use(express.static("public"))
app.use(cookieParser())


export {app}