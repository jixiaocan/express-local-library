var Book = require('../models/book');
var Author = require('../models/author');
var Genre = require('../models/genre');
var BookInstance = require('../models/bookinstance');

var async = require('async');

// display the site welcome page
exports.index = function(req, res) {
    async.parallel({
    	book_count: function(callback){
    		Book.count(callback);
    	},
    	book_instance_count: function(callback){
    		BookInstance.count(callback);
    	},
    	book_instance_available_count: function(callback){
    		BookInstance.count({status: 'Available'}, callback);
    	},
    	author_count: function(callback){
    		Author.count(callback);
    	},
    	genre_count: function(callback){
    		Genre.count(callback);
    	},
    },function(err, results){
    	res.render('index', {title: 'Local Library Home', error: err, data: results});
    });
};

// Display list of all books
exports.book_list = function(req, res, next) {
	// query all books' title and author
    Book.find({}, 'title author ').populate('author')
    	.exec(function(err, list_books){
    		if (err) { return next(err);}
    		// Successful, so render
    		res.render('book_list', {title: 'Book List', book_list: list_books});
    	});
};

// Display detail page for a specific book
exports.book_detail = function(req, res, next) {
    async.parallel({
        book: function(callback){
            Book.findById(req.params.id)
                .populate('author')
                .populate('genre')
                .exec(callback);
        },
        book_instance: function(callback){
            BookInstance.find({'book':req.params.id}).exec(callback);
        }
    }, function(err, results){
        if(err) {return next(err);}
        res.render('book_detail',{title:'Book Detail',book: results.book, book_instances:results.book_instance});
    });
};

// ADD: Display book instance create from on GET
exports.book_createinstance_get = function(req, res, next) {
    req.sanitize('id').escape();
    req.sanitize('id').trim();

    async.parallel({
        books: function(callback){
            Book.find({},'title').exec(callback);
        },
        book: function(callback){
            Book.findById(req.params.id).exec(callback);
        }
    },function(err, results){
        if(err) { return next(err);}
        res.render('bookinstance_form',{title:'Create BookInstance', book_list:results.books, thebook: results.book});
    });

};

// ADD: Display book instance create from on POST
exports.book_createinstance_post = function(req, res, next) {
    req.checkBody('book', 'Book must be specified').notEmpty(); 
    req.checkBody('imprint', 'Imprint must be specified').notEmpty();
    req.checkBody('due_back', 'Invalid date').optional({ checkFalsy: false }).isDate();

    req.sanitize('book').escape();
    req.sanitize('imprint').escape();
    req.sanitize('status').escape();
    req.sanitize('book').trim();
    req.sanitize('imprint').trim();   
    req.sanitize('status').trim();
    req.sanitize('due_back').toDate();

    var bookinstance = new BookInstance({
        book: req.body.book,
        imprint: req.body.imprint, 
        status: req.body.status,
        due_back: req.body.due_back
    });
    var errors = req.validationErrors();

     if (errors) {
        
        Book.find({},'title').exec(function (err, books) {
            if (err) { return next(err); }
                //Successful, so render
                res.render('bookinstance_form', {
                    title: 'Create BookInstance', 
                    book_list : books, 
                    selected_book : bookinstance.book._id, 
                    errors: errors, 
                    bookinstance: bookinstance 
                });
        });
        return;
    } 
    else {
    // Data from form is valid
        bookinstance.save(function (err) {
            if (err) { return next(err); }
               //successful - redirect to new book-instance record.
               console.log(bookinstance);
               res.redirect('/catalog/book/' + bookinstance.book);
        }); 
    }
};

// Display book create form on GET
exports.book_create_get = function(req, res, next) {
    // need to get and disply available Author and Genre records
    async.parallel({
        authors: function(callback){
            Author.find(callback);
        },
        genres: function(callback){
            Genre.find(callback);
        },
    },function(err,results){
        if(err) {return next(err);}
        res.render('book_form',{title: 'Create Book',authors:results.authors,genres:results.genres});
    });
};

// Handle book create on POST
exports.book_create_post = function(req, res, next) {
    req.checkBody('title', 'Title must not be empty.').notEmpty();
    req.checkBody('author', 'Author must not be empty').notEmpty();
    req.checkBody('summary', 'Summary must not be empty').notEmpty();
    req.checkBody('isbn', 'ISBN must not be empty').notEmpty();

    req.sanitize('title').escape();
    req.sanitize('author').escape();
    req.sanitize('summary').escape();
    req.sanitize('isbn').escape();
    req.sanitize('title').trim();     
    req.sanitize('author').trim();
    req.sanitize('summary').trim();
    req.sanitize('isbn').trim();
    req.sanitize('genre').escape();

    var book = new Book({
        title: req.body.title,
        author: req.body.author,
        summary: req.body.summary,
        isbn: req.body.isbn,
        genre: (typeof req.genre==='undefined') ? [] : req.body.genre.split(",")
    });

    console.log('BOOK: ' + book);
    var errors = req.validationErrors();

    if(errors){
        // some problems so we need to re-render our book
        // Get all authors and genres for form
        async.parallel({
            authors: function(callback){
                Author.find(callback);
            },
            genres: function(callback){
                Genre.find(callback);
            }
        },function(err,results){
            if(err) { return next(err);}

            // mark our selected genres as checked
            for(i = 0; i<results.genres.length; i++){
                if(book.genre.indexOf(results.genres[i]._id)>-1){
                    // Current genre is selected.
                    results.genres[i].checked = 'true';
                }
            }
            res.render('book_form',{title: 'Create Book', authors:results.authors, genres:results.genres, book: book, errors: errors });

        });
    } else {
        book.save(function(err){
            if(err){ return next(err);}
            res.redirect(book.url);
        });
    }
};

// Display book delete form on GET
exports.book_delete_get = function(req, res, next) {
    async.parallel({
        book: function(callback) {     
            Book.findById(req.params.id).exec(callback);
        },
        book_instances: function(callback) {
          BookInstance.find({ 'book': req.params.id }).exec(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        //Successful, so render
        res.render('book_delete', { title: 'Delete Book', book: results.book, book_instances: results.book_instances } );
    });
};

// Handle book delete on POST
exports.book_delete_post = function(req, res, next) {
    req.checkBody('bookid', 'Book id must exist').notEmpty();  
    
    async.parallel({
        book: function(callback) {     
            Book.findById(req.params.id).exec(callback);
        },
        book_instances: function(callback) {
          BookInstance.find({ 'book': req.params.id }).exec(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        //Success
        if (results.book_instances>0) {
            res.render('book_delete', { title: 'Delete Book', book: results.book, book_instances: results.book_instances } );
            return;
        }
        else {
            //Author has no books. Delete object and redirect to the list of authors.
            Book.findByIdAndRemove(req.body.bookid, function deleteBook(err) {
                if (err) { return next(err); }
                //Success - got to author list
                res.redirect('/catalog/books');
            });
        }
    });
};

// Display book update form on GET
exports.book_update_get = function(req, res, next) {
    req.sanitize('id').escape();
    req.sanitize('id').trim();

    //Get book, authors and genres for form
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id).populate('author').populate('genre').exec(callback);
        },
        authors: function(callback) {
            Author.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
            
        // Mark our selected genres as checked
        for (var all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
            for (var book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
                if (results.genres[all_g_iter]._id.toString()==results.book.genre[book_g_iter]._id.toString()) {
                    results.genres[all_g_iter].checked='true';
                }
            }
        }
        res.render('book_form', { title: 'Update Book', authors:results.authors, genres:results.genres, book: results.book });
    });
};

// Handle book update on POST
exports.book_update_post = function(req, res, next) {
    //Sanitize id passed in. 
    req.sanitize('id').escape();
    req.sanitize('id').trim();
    
    //Check other data
    req.checkBody('title', 'Title must not be empty.').notEmpty();
    req.checkBody('author', 'Author must not be empty').notEmpty();
    req.checkBody('summary', 'Summary must not be empty').notEmpty();
    req.checkBody('isbn', 'ISBN must not be empty').notEmpty();
    
    req.sanitize('title').escape();
    req.sanitize('author').escape();
    req.sanitize('summary').escape();
    req.sanitize('isbn').escape();
    req.sanitize('title').trim();
    req.sanitize('author').trim(); 
    req.sanitize('summary').trim();
    req.sanitize('isbn').trim();
    req.sanitize('genre').escape();
    
    var book = new Book({ 
        title: req.body.title, 
        author: req.body.author, 
        summary: req.body.summary,
        isbn: req.body.isbn,
        genre: (typeof req.body.genre==='undefined') ? [] : req.body.genre.split(","),
        _id:req.params.id //This is required, or a new ID will be assigned!
       });
    
    var errors = req.validationErrors();
    if (errors) {
        // Re-render book with error information
        // Get all authors and genres for form
        async.parallel({
            authors: function(callback) {
                Author.find(callback);
            },
            genres: function(callback) {
                Genre.find(callback);
            },
        }, function(err, results) {
            if (err) { return next(err); }
            
            // Mark our selected genres as checked
            for (i = 0; i < results.genres.length; i++) {
                if (book.genre.indexOf(results.genres[i]._id) > -1) {
                    results.genres[i].checked='true';
                }
            }
            res.render('book_form', { title: 'Update Book',authors:results.authors, genres:results.genres, book: book, errors: errors });
        });

    } 
    else {
        // Data from form is valid. Update the record.
        Book.findByIdAndUpdate(req.params.id, book, {}, function (err,thebook) {
            if (err) { return next(err); }
            //successful - redirect to book detail page.
            res.redirect(thebook.url);
        });
    }
};