const crypto = require('crypto'); //in-built in node.js, used for random string generation

const bcrypt = require('bcryptjs'); //used for encrypting(hashing) passwords
const nodemailer = require('nodemailer'); //used for sending emails
const sendgridTransport = require('nodemailer-sendgrid-transport'); //used for sending emails
const { validationResult } = require('express-validator'); //used for input validations

const User = require('../models/user');

const transporter = nodemailer.createTransport(sendgridTransport({
  auth: {
    api_key: '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'
  }
}));


exports.getLogin = (req, res, next) => {
  let message = req.flash('error'); // after this 'error' information will be 
  //removed from session
  
  if(message.length > 0){
    message = message[0];
  }else{
    message = null;
  }

  res.render('auth/login', {
    pageTitle: 'Login',
    path: '/login',
    errorMessage: message,
    oldInput: {
      email: '',
      password: ''
    },
    validationErrors: [] //,
    // isAuthenticated: req.session.isLoggedIn, //coming from middleware in app.js
    // csrfToken: req.csrfToken()
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error'); // after this 'error' information will be 
  //removed from session
  
  if(message.length > 0){
    message = message[0];
  }else{
    message = null;
  }

  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message,
    oldInput: {
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationErrors: [] //,
    // isAuthenticated: req.session.isLoggedIn, //coming from middleware in app.js
    // csrfToken: req.csrfToken()
  });
};

exports.postLogin = (req, res, next) => {
  // res.setHeader('Set-Cookie', 'loggedIn=true'); //Setting cookies
  // req.session.isLoggedIn = true; //stored session in memory, but its should not be the case
  // //memory will get full with user increase, instead it sholud be store on database
  // res.redirect('/');

  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);

  //To Do: below if block validates the user input and if validation fail
  //redirect to same old GET route with error message
  if(!errors.isEmpty()){
    return res.status(422).render('auth/login', {
      pageTitle: 'Login',
      path: '/login',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password
      },
      validationErrors: errors.array()
    });
    //422 status code is a special error code indicating validation failed
  }

  User.findOne({email: email})
    .then(user => {
      //below mentioned validation is already happeining in route file
      if(!user){
        // req.flash('error', "Invalid username or password.");
        // //1st argument in "req.flash" is key by which data will be stored in session
        // //2nd argument is value against that key

        // return res.redirect('/login');

        return res.status(422).render('auth/login', {
          pageTitle: 'Login',
          path: '/login',
          errorMessage: "Invalid username or password.",
          oldInput: {
            email: email,
            password: password
          },
          validationErrors: []
        });
        //422 status code is a special error code indicating validation failed
      }

      //If user exist will compare password
      bcrypt.compare(password, user.password)
      //this method give error on some other issue but not on password mismatch
      //instead it will flow to ".then" block incase of password match(true)/mismatch(false)
        .then(hasMatched => {
          //if password matches
          if(hasMatched){
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              console.log("Session save error",err);
              res.redirect('/');
            }) 
          }

          
          //in-case password doesn't match
          // req.flash('error', "Invalid username or password.");
          // //1st argument in "req.flash" is key by which data will be stored in session
          // //2nd argument is value against that key
          // return res.redirect('/login');
          return res.status(422).render('auth/login', {
            pageTitle: 'Login',
            path: '/login',
            errorMessage: "Invalid username or password.",
            oldInput: {
              email: email,
              password: password
            },
            validationErrors: []
          });
          //422 status code is a special error code indicating validation failed
        })
        .catch(err => {
          // console.log(err);
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        });
    })
    .catch(err => {
      // console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  const errors = validationResult(req);

  //To Do: below if block validates the user input and if validation fail
  //redirect to same old GET route with error message
  if(!errors.isEmpty()){
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: confirmPassword
      },
      validationErrors: errors.array()
    });
    //422 status code is a special error code indicating validation failed
  }

  //To Do : check if user exists
  // User.findOne({ email: email }) //no need to check as we have impelemted the validation 
  // //in route file using "express-validator"
  //   .then(userDoc => {
  //     if(userDoc){
  //       req.flash('error', "Email already exist");
  //       //1st argument in "req.flash" is key by which data will be stored in session
  //       //2nd argument is value against that key
  //       return res.redirect('/signup'); //not doing error handling as of now
  //     }

      // return bcrypt
      bcrypt
        .hash(password,12) //as per instructor 12 value of salt is considered
        //more secure
        .then(hasedPassword => {
          const user = new User({
            email: email,
            password: hasedPassword,
            cart: {
              items: []
            }
          });
          
          return user.save();
        })
        .then(result => {
          res.redirect('/login');

          return transporter.sendMail({
            to: email,
            from: 'rritesh95@gmail.com', //it should be the verified email id on sendgrid
            subject: 'Signup Succeeded!',
            html: '<h1>You successfuly signed up!</h1>'
          });
        })
        .catch(err => {
          // console.log(err);
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        });
    // })
    // .catch(err => console.log(err));
};

exports.postLogout = (req, res, next) => {

  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  })
};

exports.getResetPassword = (req,res,next) => {
  let message = req.flash('error'); // after this 'error' information will be 
  //removed from session
  
  if(message.length > 0){
    message = message[0];
  }else{
    message = null;
  }

  res.render('auth/reset-password', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message //,
    // isAuthenticated: req.session.isLoggedIn, //coming from middleware in app.js
    // csrfToken: req.csrfToken()
  });
}

exports.postResetPassword = (req,res,next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if(err){
      console.log(err);
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');

    //Checking if user exist
    User.findOne({email: req.body.email})
      .then(user => {
        if(!user){
          req.flash('error', "No user exist with this email.");
          return res.redirect('/reset');
        }

        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + (60 * 60 * 1000); //now + 1 hour
        return user.save();
      })
      .then(result => {
        res.redirect('/');
        return transporter.sendMail({
          to: req.body.email,
          from: 'rritesh95@gmail.com', //it should be the verified email id on sendgrid
          subject: 'Password reset',
          html: `
            <p>You requested a password reset.</p>
            <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to
            set a new password.</p>
          `
        });
      })
      .catch(err => {
        // console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  })
};

exports.getNewPassword = (req,res,next) => {
  const token = req.params.token;

  User.findOne({resetToken: token, resetTokenExpiration: {$gt : Date.now()}})
    .then(user => {
      let message = req.flash('error'); // after this 'error' information will be 
      //removed from session
      
      if(message.length > 0){
        message = message[0];
      }else{
        message = null;
      }

      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessage: message,
        userId: user._id,
        passwordToken: token //,
        // isAuthenticated: req.session.isLoggedIn, //coming from middleware in app.js
        // csrfToken: req.csrfToken()
      });
    })
    .catch(err => {
      // console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postNewPassword = (req,res,next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  User.findOne({
    resetToken: passwordToken, 
    resetTokenExpiration: {$gt: Date.now()}, 
    _id: userId
  })
  .then(user => {
    resetUser = user;
    return bcrypt.hash(newPassword, 12);
  })
  .then(hashedPassword => {
    resetUser.password = hashedPassword;
    resetUser.resetToken = undefined;
    resetUser.resetTokenExpiration = undefined;

    return resetUser.save();
  })
  .then(result => {
    res.redirect('/login');
  })
  .catch(err => {
    // console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
}