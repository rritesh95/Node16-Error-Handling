const express = require('express');
// const { check } = require('express-validator/check'); //used by instructor but deprecated now
const { check, body } = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post(
    '/login',
    [
        body('email')
            .isEmail()
            .withMessage('Invalid username or password.')
            // .custom( value => {
            //     return User.findOne({email: value})
            //         .then(user => {
            //             if(!user){
            //                 return Promise.reject(
            //                     "Invalid username or password."
            //                 );
            //             }
            //         });
            // })
            ,
        body(
            'password',
            'Please enter a password with only numbers and characters and atleast length of 5.'
        ) //check only in request body for 'password' in in-coming request
            .isLength({ min: 5 })
            .isAlphanumeric()   
    ], 
    authController.postLogin
);

router.post(
    '/signup',
    [ //we can pass validations in sequence also but passing here an Array to keep
      //it seperate and more readable
        check('email') //check everywhere for 'email' in in-coming request
            .isEmail()
            .withMessage("Please enter valid email.")
            .custom((value) => {
                //'custom' expects to return boolean(true/false) or promise or throw an error

                // if(value === "test@test.com"){
                //     throw new Error('This email is forbidden!');
                // }
                // return true; //if validation passes

                //below code does Async validation as it has to check with database
                //and wait for promise
                //To Do : check if user exists
                return User.findOne({ email: value })
                    .then(userDoc => {
                    if(userDoc){
                        return Promise.reject(
                            "Email already exist."
                        );
                    }
                });
            })
            .normalizeEmail(), //we can chain validations like this express-validator
        body(
            'password',
            'Please enter a password with only numbers and characters and atleast length of 5.'
            //if our error message is generic for all the validations we are doing then we can
            //keep here as second argument, otherwise use 'withMessage' with every validations
        ) //check only in request body for 'password' in in-coming request
            .isLength({ min: 5 })
            .isAlphanumeric()
            .trim(),
        body('confirmPassword')
            .trim()
            .custom((value, { req }) => {
                if(value !== req.body.password){
                    throw new Error('Passwords does not match.');
                }
                return true;
            })
    ],
    authController.postSignup
);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getResetPassword);

router.post('/reset', authController.postResetPassword);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;