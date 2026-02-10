import { Strategy as GoogleStrategy } from 'passport-google-oauth2';
import passport from 'passport';
import prisma from './database.ts';
// import User from '../models/User.js'; // 1. Import your DB model

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error(
    'Google Client ID and Secret must be set in environment variables'
  );
}

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:8000/auth/google/callback',
      passReqToCallback: true,
    },
    async (
      request: any,
      accessToken: any,
      refreshToken: any,
      profile: any,
      done: any
    ) => {
      try {
        // 2. Logic to Find or Create user in Database
        // let user = await User.findOne({ googleId: profile.id });
        let user = await prisma.user.findUnique({
          where: { email: profile.emails[0].value },
        });

        // if (!user) {
        //   user = await User.create({
        //     googleId: profile.id,
        //     email: profile.emails[0].value,
        //     name: profile.displayName,
        //     avatar: profile.photos[0].value
        //   });
        // }

        // For now, passing profile, but replace with your 'user' variable above
        return done(null, user || profile);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// 3. Serialize the database ID instead of the whole object
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// 4. Use the ID to find the user in the DB on every request
passport.deserializeUser(async (id: string, done) => {
  try {
    // const user = await User.findById(id);
    // done(null, user);
    done(null, id); // Placeholder
  } catch (err) {
    done(err, null);
  }
});
