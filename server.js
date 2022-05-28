const express = require("express");
const http = require('http');
const bcrypt = require('bcrypt');
const path = require("path");
const bodyParser = require('body-parser');
const users = require('./data').userDB;
const nodemailer = require("nodemailer");
const multiparty = require("multiparty");
const { getMaxListeners } = require("process");
let embedToken = require(__dirname + '/embedConfigService.js');
const utils = require(__dirname + "/utils.js");
const ejs = require('ejs');
const PORT = 3000;

const app = express();
const server = http.createServer(app);
// app.use(express.static(path.join(__dirname,'./public')));

// serve your css as static
app.use(express.static(__dirname));
app.use('/js', express.static('./node_modules/bootstrap/dist/js/')); // Redirect bootstrap JS
app.use('/js', express.static('./node_modules/jquery/dist/')); // Redirect JS jQuery
app.use('/js', express.static('./node_modules/powerbi-client/dist/')) // Redirect JS PowerBI
app.use('/css', express.static('./node_modules/bootstrap/dist/css/')); // Redirect CSS bootstrap
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


app.get("/", (req, res) => {
  res.sendFile(__dirname + "index.html");
});


const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  auth: {
    user: 'cse2022.mansi@gmail.com',
    pass: 'Leo$2001',
  },
});

// verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log(error);
  } else {
    console.log("Server is ready to take our messages");
  }
});

app.post("/send", (req, res) => {
  let form = new multiparty.Form();
  let data = {};
  form.parse(req, function (err, fields) {
    Object.keys(fields).forEach(function (property) {
      data[property] = fields[property].toString();
    });
    console.log(data);
    const mail = {
      sender: `${data.name} <${data.email}>`,
      to: 'smparihar25@gmail.com', // receiver email,
      subject: data.subject,
      text: `${data.name} <${data.email}> \n${data.message}`,
    };
    transporter.sendMail(mail, (err, data) => {
      if (err) {
        console.log(err);
        res.status(500).send("Something went wrong.");
      } else {
        res.status(200).send("Email successfully sent to recipient!");
      }
    });
  });
});

// Register page

app.post('/register', async (req, res) => {
  try{
      let foundUser = users.find((data) => req.body.email === data.email);
      if (!foundUser) {
  
          let hashPassword = await bcrypt.hash(req.body.password, 10);
  
          let newUser = {
              id: Date.now(),
              username: req.body.username,
              email: req.body.email,
              password: hashPassword,
          };
          users.push(newUser);
          console.log('User list', users);
  
          res.write(
            '<script>window.alert("Registration Successful. Redirecting to Login Page.");window.location="/login.html";</script>'
          );
          
      } else {
          res.write(
            '<script>window.alert("Email already used.");window.location="/login.html";</script>'
          );
      }
  } catch{
    res.sendFile(__dirname+"/internalerror.html");
  }
});

// Login page

app.post('/login', async (req, res) => {
  try{
      let foundUser = users.find((data) => req.body.email === data.email);
      if (foundUser) {
  
          let submittedPass = req.body.password; 
          let storedPass = foundUser.password; 
  
          const passwordMatch = await bcrypt.compare(submittedPass, storedPass);
          if (passwordMatch) {
              let usrname = foundUser.username;
              res.write(
                '<script>window.alert("Log In Successful.");window.location="/landingpage.html";</script>'
              );
          } else {
              res.write(
                '<script>window.alert("Invalid Email or Password.");window.location="/login.html";</script>'
              );
            }
      }
      else {
  
          let fakePass = `$2b$$10$ifgfgfgfgfgfgfggfgfgfggggfgfgfga`;
          await bcrypt.compare(req.body.password, fakePass);
          
          res.write(
            '<script>window.alert("Invalid Email or Password.");window.location="/login.html";</script>'
          );

          // res.send("<div align ='center'><h2>Invalid email or password</h2></div><br><br><div align='center'><a href='./login.html'>login again<a><div>");
      }
  } catch{
      res.sendFile(__dirname+"/internalerror.html");
  }
});

// Calling Power BI 
app.get('/getEmbedToken', async function (req, res) {

  // Validate whether all the required configurations are provided in config.json
  configCheckResult = utils.validateConfig();
  if (configCheckResult) {
      return res.status(400).send({
          "error": configCheckResult
      });
  }
  // Get the details like Embed URL, Access token and Expiry
  let result = await embedToken.getEmbedInfo();

  // result.status specified the statusCode that will be sent along with the result object
  res.status(result.status).send(result);
});
/*************************************************/
// Express server listening...
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`);
});