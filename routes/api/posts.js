const express = require('express');

const router = express.Router();

const mongoose = require('mongoose');
const passport = require('passport');

const Profile = require('../../models/Profile');
const Post = require('../../models/Posts');

const validatePostInput = require('../../validation/post')

// @route GET api/posts/test @desc Tests post route @access Public

router.get('/test', (req, res) => res.json({
  msg: 'Posts Works',
}));

// @route GET api/posts@desc Get Posts route @access Public

router.get('/', (req, res) => {
  Post.find().sort({
    date: -1
  }).then(posts => res.json(posts)).catch(err => res.status(404).json({
    nopostsfound: 'No Posts found'
  }))
});

// @route GET api/posts@desc Get post by id @access Public

router.get('/:id', (req, res) => {
  Post.findById(req.params.id).then(post => res.json(post)).catch(err => res.status(404).json({
    nopostfound: 'No Post found with that ID'
  }))
})

// @route POST api/posts @desc Create Post @access Private

router.post('/', passport.authenticate('jwt', {
  session: false
}), (req, res) => {
  const {
    errors,
    isValid
  } = validatePostInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors)
  }
  const newPost = new Post({
    text: req.body.text,
    name: req.body.name,
    avatar: req.body.avatar,
    user: req.user.id,
  });
  newPost.save().then(post => res.json(post))
});

// @route DELETE api/posts/:id @desc Get Posts route @access Private
router.delete('/:id', passport.authenticate('jwt', {
  session: false
}), (req, res) => {
  Profile.findOne({
    user: req.user.id
  }).then(profile => {
    Post.findById(req.params.id).then(post => {
      if (post.user.toString() !== req.user.id) {
        return res.status(401).json({
          notauthorized: 'User not Authorized'
        })
      }
      post.remove().then(() => res.json({
        success: true
      })).catch(err => res.status(404).json({
        postnotfound: 'No post found'
      }))
    })
  })
});
// @route POST api/posts/like/:id @desc Like Post @access Private
router.post('/like/:id', passport.authenticate('jwt', {
  session: false
}), (req, res) => {
  Profile.findOne({
    user: req.user.id
  }).then(profile => {
    Post.findById(req.params.id).then(post => {
      if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
        return res.status(400).json({
          alreadyliked: 'User already liked this post'
        })
      }
      post.likes.unshift({
        user: req.user.id
      });
      post.save().then(post => res.json(post))
    }).catch(err => res.status(404).json({
      postnotfound: 'No Post Found'
    }))
  })
});
// @route POST api/posts/like/:id @desc Unlike Post @access Private
router.post('/unlike/:id', passport.authenticate('jwt', {
  session: false
}), (req, res) => {
  Profile.findOne({
    user: req.user.id
  }).then(profile => {
    Post.findById(req.params.id).then(post => {
      if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
        return res.status(400).json({
          notliked: 'You have not liked this post'
        })
      }
      const removeIndex = post.likes.map(item => item.user.toString()).indexOf(req.user.id);
      post.likes.splice(removeIndex, 1);
      post.save().then((post => res.json(post))).catch(err => res.status(404).json({
        postnotfound: 'No Post Found'
      }))
    })
  })
})

// @route POST api/posts/comment/:id @desc Comment on a Post @access Private

router.post('/comment/:id', passport.authenticate('jwt', {
  session: false
}), (req, res) => {
  const {
    errors,
    isValid
  } = validatePostInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors)
  }
  Post.findById(req.params.id).then(post => {
    const newComment = {
      text: req.body.text,
      name: req.body.name,
      avatar: req.body.avatar,
      user: req.user.id,
    }
    post.comments.unshift(newComment);
    post.save().then(post => res.json(post))
  }).catch(err => res.status(404).json({
    postnotfound: 'No post found'
  }))
})

// @route POST api/posts/comment/:id @desc Remove comment from post @access Private

router.delete('/comment/:id/:comment_id', passport.authenticate('jwt', {
  session: false
}), (req, res) => {
  Post.findById(req.params.id).then(post => {
    if (post.comments.filter(comment => comment._id.toString() === req.params.comment_id).length === 0) {
      return res.status(404).json({
        commentnotexists: 'Comment does not exist'
      })
    }
    const removeIndex = post.comments.map(item => item._id.toString()).indexOf(req.params.comment_id);
    post.comments.splice(removeIndex, 1)
    post.save().then(post => res.json(post))
  }).catch(err => res.status(404).json({
    postnotfound: 'No post found'
  }))
})
module.exports = router;