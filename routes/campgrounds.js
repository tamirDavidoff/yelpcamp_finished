var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var Review = require("../models/review");
var middleware = require("../middleware");
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'tipagambler', 
 api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

//All Campgrounds Route

router.get("/", function(req,res){
     var noMatch = null;
    if(req.query.search){
           const regex = new RegExp(escapeRegex(req.query.search), 'gi');
           Campground.find({name: regex}, function(err, allCampgrounds){
            if(err){
                console.log(err);
            } else {
               
                if(allCampgrounds.length < 1) {
                    noMatch = "no campgrounds match that, please try again";
                } 
                res.render("campgrounds/index", {campgrounds: allCampgrounds, page: 'campgrounds', noMatch: noMatch});
                
            }
        });
    } else {
        Campground.find({}, function(err, allCampgrounds){
            if(err){
                console.log(err);
            } else {
                res.render("campgrounds/index", {campgrounds: allCampgrounds, page: 'campgrounds',  noMatch: noMatch});
            }
        });
    }
});
// Show form to create new Campground
router.get("/new", middleware.isLoggedIn, function(req,res){
   res.render("campgrounds/new"); 
});

// Add New Campground Logic
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {

    cloudinary.uploader.upload(req.file.path, function(result) {
      // add cloudinary url for the image to the campground object under image property
      req.body.campground.image = result.secure_url;
      // add author to campground
      req.body.campground.author = {
        id: req.user._id,
        username: req.user.username
      }
      console.log(req.body);
      Campground.create(req.body.campground, function(err, campground) {
        if (err) {
          req.flash('error', err.message);
          return res.redirect('back');
        }
        res.redirect('/campgrounds/' + campground.id);
      });
    });
});


// SHOW - shows more info about one campground
router.get("/:id", function (req, res) {
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").populate({
        path: "reviews",
        options: {sort: {createdAt: -1}}
    }).exec(function (err, foundCampground) {
        if (err) {
            console.log(err);
        } else {
            //render show template with that campground
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});


//EDIT CAMPGROUND ROTUE FORM
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req,res){
            Campground.findById(req.params.id, function(err,foundCampground){
                if(err){
                    req.flash("error", "Campground not found");
                    res.redirect("/campgrounds");
                } else {
                    res.render("campgrounds/edit", {campground: foundCampground});
                }
            });
});
// SUMBIT UPDATE TO CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampgroundOwnership, function(req,res){
    //find and update currect campground
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
        if(err){
            res.redirect("/campgrounds");
        } else {
            res.redirect("/campgrounds/" + req.params.id);
        }
    })
    //redirect somehwere
})

// DESTROY CAMPGREOUND ROUTE 

// DESTROY CAMPGROUND ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, function (req, res) {
    Campground.findById(req.params.id, function (err, campground) {
        if (err) {
            res.redirect("/campgrounds");
        } else {
            // deletes all comments associated with the campground
            Comment.remove({"_id": {$in: campground.comments}}, function (err) {
                if (err) {
                    console.log(err);
                    return res.redirect("/campgrounds");
                }
                // deletes all reviews associated with the campground
                Review.remove({"_id": {$in: campground.reviews}}, function (err) {
                    if (err) {
                        console.log(err);
                        return res.redirect("/campgrounds");
                    }
                    //  delete the campground
                    campground.remove();
                    req.flash("success", "Campground deleted successfully!");
                    res.redirect("/campgrounds");
                });
            });
        }
    });
});


router.get("/testing", function(req,res){
    res.send("testing");
})
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;