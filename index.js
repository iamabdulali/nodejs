import express from 'express'
import path from 'path'
import mongoose from 'mongoose'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

mongoose.connect("mongodb://localhost:27017", {
    dbName: 'backend'
}).then(() =>{
    console.log("Database Connected")
}).catch((e) =>{
    console.log(e)
})

const userSchema = new mongoose.Schema({
    Name: String,
    Email: String,
    Password: String
})

const User = mongoose.model("User", userSchema)

const app = express()

app.use(express.static(path.join(path.resolve(), "public")))
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())

app.set("view engine", "ejs")

const isAuthenticated = async (req,res,next) =>{
    const cookie = req.cookies.token


    if(cookie){
        const decoded =  jwt.verify(cookie ,"alskjdlksajdlkajslkdj")
        req.user = await User.findById(decoded._id)
        next()
    }
    else{
        res.redirect("/login")
    }
    
}

app.get("/", isAuthenticated ,(req,res) =>{
    res.render("logout", {name: req.user.Name})
})

app.get("/register",(req,res) =>{
    res.render("register")
})

app.get("/login" ,(req,res) =>{
    res.render("login")
})
 

app.post("/register", async (req,res) =>{
    
    const {Name, Email, Password} = req.body

 let user = await User.findOne({Email})
 console.log(user)

 if(user){
    res.redirect("/login")
 }

 const hashedPassword = await bcrypt.hash(Password, 10)

   user =  await User.create({
        Name: Name,
        Email: Email,
        Password: hashedPassword
    })

    const token = jwt.sign({_id: user._id}, "alskjdlksajdlkajslkdj")

    res.cookie("token", token ,{
        httpOnly: true
    })
    res.redirect("/")
})

app.post("/login", async (req,res) =>{
    const {Email, Password} = req.body

    let user = await User.findOne({Email})
   
    if(!user){
       return res.redirect("/register")
    }

    const isMatch = await bcrypt.compare(Password,user.Password)

    if(!isMatch){
        return res.render("login", {Email, message: "Incorrect Password"})
    }
    
    const token = jwt.sign({_id: user._id}, "alskjdlksajdlkajslkdj")

    res.cookie("token", token ,{
        httpOnly: true
    })
    res.redirect("/")
})

app.get("/logout", (req,res) =>{
    res.cookie("token", null,{
        expires: new Date(Date.now())
    })
    res.redirect("/")
})

app.get("/success", (req,res) =>{
    res.render("success")
})


app.listen(5000, () =>{
    console.log("APP IS RUNNING")
})

