import { Router } from 'express';

import '../config/google.config.ts';
import passport from 'passport';

const router = Router();


function isLoggedIn(req: any, res: any, next: any) {
  req.user ? next() : res.sendStatus(401);
}


router.get('/login', (req, res) => {
  res.send("<a href='/auth/google'>Login with Google</a>");
});

router.get('/google', (req, res) => {
  passport.authenticate('google', { scope: ['email', 'profile'] })(req, res);
  
});

router.get(
  '/google/callback',
  passport.authenticate('google', {
    successRedirect: '/auth/secret',
    failureRedirect: '/auth/google/failure',
  })
);

router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.sendStatus(500);
    req.session.destroy((err) => {
      res.send('Goodbye!');
    });
  });
});

router.get('/auth/google/failure', (req, res) => {
  res.send('Failed to authenticate..');
});


router.get('/secret', isLoggedIn, (req, res) => {
  res.send('done');
});

export default router;
