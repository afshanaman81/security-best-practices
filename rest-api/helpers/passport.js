const passport      = require('passport')
const LocalStrategy = require('passport-local').Strategy
const jwt           = require("jsonwebtoken")
const User          = require('../models/User')

// Configure the local strategy for use by Passport
passport.use('local',
    new LocalStrategy(async function(email, password, done) {
        let user;
        // 1. check if the user is found
        try {
            user = await User.findByEmail(email)
            //console.log(user)
            if (!user) {
                return done(null, false, {message: 'No user found by that email'});
            }
        } catch (e) {
            return done(e)
        }

        // 2. check if password matches
        try{
            let match = User.comparePassword(password, user.password)
            if (!match) {
                return done(null, false, {message: 'Password is incorrect'});
            }
        } catch (e) {
            return done(e)
        }
        
        // 3. user successfully found/authenticated
        // TODO: Do I need to send a token to the client? what is token used for?
        // seems like this token can be used for CSRF protection 
        // No cookies = No CSRF
        // (instead of the usual CSRF token sent as value of a hidden field in a POST request)
        //https://security.stackexchange.com/questions/170388/do-i-need-csrf-token-if-im-using-bearer-jwt
        const token = `JWT ${jwt.sign({ id: user._id }, process.env.AUTH_SECRET)}`
        user.token = token
        delete user.password
        return done(null, user)
    }));


passport.serializeUser((user, done) => {
    console.log(`Serialize`)
    //console.log(user)
    done(null, user._id)
});

passport.deserializeUser(async (id, done) => {
    console.log(`Deserialize`)
    //console.log(id)
    try {
        let user = await User.findById(id)
        if (!user) {
            return done(new Error('user not found'))
        }
        done(null, user)
    } catch (e) {
        done(e)
    }
})

exports.authorize = (req, res, next) => {
    const message = `Route ${req.isAuthenticated() ? 'is':'is not'} Authorized`
    console.log(message)
    
    if (req.session.visits){
        console.log(req.session.visits)
        req.session.visits++
    }  

    if (req.isAuthenticated()) {
        return next()
    }
    
    res.json({message})
}
