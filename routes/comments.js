var express = require("express");
var router = express.Router({mergeParams: true});
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");

// Comments New
router.get("/new", middleware.isLoggedIn, function(req, res){
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
        } else {
            res.render("comments/new", {campground: campground});
        }
    }) 
});
//Comments Create
router.post("/", middleware.isLoggedIn, function(req,res){
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            req.flash("error", "Something not working properly");
            console.log(err);
            res.redirect("/campgrounds");
        } else {
            Comment.create(req.body.comment, function(err, comment){
                if(err){
                    console.lof(err);
                } else {
                    //add username and id to comments
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    //save comment
                    comment.save();
                    campground.comments.push(comment);
                    campground.save();
                    req.flash("success", "Successfully Added Comment");
                    res.redirect('/campgrounds/'+ campground._id);
                }
            });
        }
    });
});

// COMMENTS EDIT ROUTE 
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req,res){
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err){
            res.redirect("back");
        } else {
            Comment.findById(req.params.comment_id, function(err, foundComment){
                if(err){
                    res.redirect("back");
                } else {
                    res.render("comments/edit", {campground: foundCampground, comment: foundComment});
                }
            });
        }
    });
});

// COMMENTS UPDATE
router.put("/:comment_id", middleware.checkCommentOwnership, function(req,res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
        if(err){
            res.redirect("back");
        } else{
            res.redirect("/campgrounds/"+ req.params.id);
        }
    });
});



// COMMENT DESTROY ROUTE 

router.delete("/:comment_id", middleware.checkCommentOwnership,function(req,res){
    Comment.findByIdAndRemove(req.params.comment_id, function(err, deletedComment){
        if(err){
            res.redirect("back");
        } else {
            req.flash("success", "Successfully removed comment");
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});



module.exports = router;