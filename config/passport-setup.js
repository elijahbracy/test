const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20');
const db = require('../db');


passport.serializeUser((user, done)=> {
    done(null, user.user_id);
});

passport.deserializeUser((id, done)=> {
    db.getUserById(id).then((user) => {
        done(null, user);
    });
});


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: '/auth/google/callback' // Change the callback URL as per your setup
}, async (accessToken, refreshToken, profile, done) => {
    const firstName = profile.name.givenName;
    const lastName = profile.name.familyName;
    const email = profile.emails[0].value;
    const sub = profile.id;
    const hd = profile._json.hd; // hosted domain, make sure user is from ramapo.edu
    //console.log(profile);
    if (hd === 'ramapo.edu') {
        const user = await db.getUserByEmail(email); // look for existing user
        if (user) {
            console.log('user is: ', user);
            done(null, user);
        }
        else {
            await db.createUser(firstName, lastName, email, sub);
            const newUser = await db.getUserByEmail(email);
            console.log('new user created: ' + newUser);
            done(null, newUser);
        }
    }
    else {
        console.log('denied: user not from ramapo.edu');

    }
  }
));


module.exports = passport;