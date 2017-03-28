var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
	// This redirects to the specified page, by default sending HTTP status code "302 Found". 
	// You can change the status code returned if needed, and supply either absolute or relative paths.
  	res.redirect('/catalog');
});

module.exports = router;
