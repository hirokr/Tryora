import { Router } from 'express';
import { isLoggedIn } from '#src/middlewares/authenticate.ts';
import { googleAuth, googleAuthCallback, googleAuthFailure } from '#src/controllers/auth.controller.ts';

const router = Router();

// TODO: Fix the routes

// Google OAuth2 routes 
router.get('/google', googleAuth);
router.get('/google/callback', googleAuthCallback);
router.get('/google/failure', googleAuthFailure);

// TODO: Impement facebook and github auth routes

router.get('/refresh', )

router.get('/signup', (req, res) => {
  res.send("<a href='/auth/google'>Login with Google</a>");
});


router.get('/signin', (req, res) => {
  res.send("<a href='/auth/google'>Login with Google</a>");
});


router.get('/signout', (req, res) => {
  req.logout((err) => {
    if (err) return res.sendStatus(500);
    req.session.destroy((err) => {
      res.send('Goodbye!');
    });
  });
});



router.get('/secret', isLoggedIn, (req, res) => {
  res.send('done');
});

export default router;
