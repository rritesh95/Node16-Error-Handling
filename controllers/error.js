exports.get404 = (req, res, next) => {
  res.status(404).render('404', { //404 is a status cod eincase file is not found
    pageTitle: 'Page Not Found', 
    path: '/404',
    isAuthenticated: req.session.isLoggedIn
  });
};

exports.get500 = (req, res, next) => {
  res.status(500).render('500', { //500 is a status code when something fail at server
    pageTitle: 'Page Not Found', 
    path: '/500',
    isAuthenticated: req.session.isLoggedIn
  });
};
