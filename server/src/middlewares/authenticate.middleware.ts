export const isLoggedIn = (req: any, res: any, next: any) => {
  req.user ? next() : res.sendStatus(401);
};
