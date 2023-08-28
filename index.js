const express = require('express');
const cors = require('cors');   
const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User.js');
const Place = require('./models/Place.js');
const Booking = require('./models/Booking.js');
const cookieParser = require('cookie-parser');
const imageDownloader = require('image-downloader');
const multer = require('multer');
const fs = require('fs');

mongoose.set('strictQuery', true);

require('dotenv').config();
const app = express();

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = 'fasefraw4r5r3wq45wdfgw34twdfg';

app.use(express.json());
app.use(cookieParser()); 
app.use('/uploads', express.static(__dirname+'/uploads'));
app.use(cors({
  credentials: true,
  origin: "*",
}));

mongoose.connect("mongodb+srv://lakshit_juneja:2FTB3NtmQ4l23V8J@cluster0.6q9oq9v.mongodb.net/?retryWrites=true&w=majority");



function getUserDataFromReq(req) {
  return new Promise((resolve, reject) => {
    jwt.verify(req.cookies.token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      resolve(userData);
    });
  });
}

app.get("/", (req, res, next) => {
  res.send("<h1>Working</h1>");
});

app.get('/api/test', (req,res) => {
  // mongoose.connect("mongodb+srv://lakshit_juneja:2FTB3NtmQ4l23V8J@cluster0.6q9oq9v.mongodb.net/?retryWrites=true&w=majority");
  res.json('test ok');
});

app.post('/api/register', async (req,res) => {
  const {name,email,password} = req.body;

  try {
    const userDoc = await User.create({
      name,
      email,
      password:bcrypt.hashSync(password, bcryptSalt),
    });

    res.json({name,email,password});
  } catch (e) {
    res.status(422).json(e);
  }

});

app.post('/api/login', async (req,res) => {
  // mongoose.connect("mongodb+srv://lakshit_juneja:2FTB3NtmQ4l23V8J@cluster0.6q9oq9v.mongodb.net/?retryWrites=true&w=majority");
  const {email,password} = req.body;
  const userDoc = await User.findOne({email});
  if (userDoc) {
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk) {
      jwt.sign({
        email:userDoc.email,
        id:userDoc._id
      }, jwtSecret, {}, (err,token) => {
        if (err) throw err;
        res.cookie('token', token).json(userDoc);
      });
    } else {
      res.status(422).json('pass not ok');
    }
  } else {
    res.json('not found');
  }
});

app.get('/api/profile', (req,res) => {
  // mongoose.connect("mongodb+srv://lakshit_juneja:2FTB3NtmQ4l23V8J@cluster0.6q9oq9v.mongodb.net/?retryWrites=true&w=majority");
  const {token} = req.cookies;
  if (token) {
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      const {name,email,_id} = await User.findById(userData.id);
      res.json({name,email,_id});
    });
  } else {
    res.json(null);
  }
});

app.post('/api/logout', (req,res) => {
  res.cookie('token', '').json(true);
});


app.post('/api/upload-by-link', async (req,res) => {
  try{const {link} = req.body;
  const newName = 'photo' + Date.now() + '.jpg';
  await imageDownloader.image({
    url: link,
    dest: __dirname + '/uploads/' +newName,
  });
  res.json(newName);}catch{
    req.json(500)
  }
});


const photosMiddleware = multer({dest:'uploads/'});
app.post('/api/upload', photosMiddleware.array('photos', 100),async (req,res) => {
try{  const uploadedFiles = [];
  for (let i = 0; i < req.files.length; i++) {
    const {path,originalname} = req.files[i];
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    const newPath = path + '.' + ext;
    fs.renameSync(path, newPath);
    uploadedFiles.push(newPath.replace('uploads/',''));
  }
  res.json(uploadedFiles);}catch{
    res.json(500)
  }
});

app.post('/api/places', (req,res) => {
  // mongoose.connect("mongodb+srv://lakshit_juneja:2FTB3NtmQ4l23V8J@cluster0.6q9oq9v.mongodb.net/?retryWrites=true&w=majority");
  const {token} = req.cookies;
  const {
    title,address,addedPhotos,description,price,
    perks,extraInfo,checkIn,checkOut,maxGuests,
  } = req.body;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    try{if (err) throw err;
    const placeDoc = await Place.create({
      owner:userData.id,price,
      title,address,photos:addedPhotos,description,
      perks,extraInfo,checkIn,checkOut,maxGuests,
    });
    res.json(placeDoc);}catch{
      res.json(500)
    }
  });
});

app.get('/api/user-places', (req,res) => {
 try{ // mongoose.connect("mongodb+srv://lakshit_juneja:2FTB3NtmQ4l23V8J@cluster0.6q9oq9v.mongodb.net/?retryWrites=true&w=majority");
  const {token} = req.cookies;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    const {id} = userData;
    res.json( await Place.find({owner:id}) );
  });}catch{
    res.json(500)
  }
});

app.get('/api/places/:id', async (req,res) => {
 try{ // mongoose.connect("mongodb+srv://lakshit_juneja:2FTB3NtmQ4l23V8J@cluster0.6q9oq9v.mongodb.net/?retryWrites=true&w=majority");
  const {id} = req.params;
  res.json(await Place.findById(id));}catch{
    res.json(500)
  }
});

app.put('/api/places', async (req,res) => {
  try{// mongoose.connect("mongodb+srv://lakshit_juneja:2FTB3NtmQ4l23V8J@cluster0.6q9oq9v.mongodb.net/?retryWrites=true&w=majority");
  const {token} = req.cookies;
  const {
    id, title,address,addedPhotos,description,
    perks,extraInfo,checkIn,checkOut,maxGuests,price,
  } = req.body;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    const placeDoc = await Place.findById(id);
    if (userData.id === placeDoc.owner.toString()) {
      placeDoc.set({
        title,address,photos:addedPhotos,description,
        perks,extraInfo,checkIn,checkOut,maxGuests,price,
      });
      await placeDoc.save();
      res.json('ok');
    }
  });}catch{
    res.json(500)
  }
});

app.get('/api/places', async (req,res) => {
  // mongoose.connect("mongodb+srv://lakshit_juneja:2FTB3NtmQ4l23V8J@cluster0.6q9oq9v.mongodb.net/?retryWrites=true&w=majority");
  try{res.json( await Place.find() );}catch{res.json(404)}
});

app.post('/api/bookings', async (req, res) => {
  // mongoose.connect("mongodb+srv://lakshit_juneja:2FTB3NtmQ4l23V8J@cluster0.6q9oq9v.mongodb.net/?retryWrites=true&w=majority");
 try{ const userData = await getUserDataFromReq(req);
  const {
    place,checkIn,checkOut,numberOfGuests,name,phone,price,
  } = req.body;
  Booking.create({
    place,checkIn,checkOut,numberOfGuests,name,phone,price,
    user:userData.id,
  }).then((doc) => {
    res.json(doc);
  }).catch((err) => {
    throw err;
  });}catch{res.json(500)}
});



app.get('/api/bookings', async (req,res) => {
  // mongoose.connect("mongodb+srv://lakshit_juneja:2FTB3NtmQ4l23V8J@cluster0.6q9oq9v.mongodb.net/?retryWrites=true&w=majority");
  try{const userData = await getUserDataFromReq(req);
  res.json( await Booking.find({user:userData.id}).populate('place') );}catch{
    res.json(500)
  }
});

app.listen(4000, () =>
  console.log(
    "Server is working on PORT: 4000"
  )
);
