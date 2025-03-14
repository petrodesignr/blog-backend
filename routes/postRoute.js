const express = require('express');
const PostRoute = express.Router();
const postController = require('../controllers/postController');

PostRoute.post('/add',  postController.addPost);
PostRoute.get('/getpost/:id', postController.getPost);
PostRoute.get('/getAll', postController.getAllPosts);
PostRoute.get('/delete/:id', postController.deletePost);
PostRoute.put('/update', postController.updatePost);
PostRoute.get('/postUser', postController.getUserPost);
PostRoute.get('/getlike', postController.getLike);
PostRoute.post('/like', postController.likePost);
PostRoute.post('/unlike', postController.unlikePost);
PostRoute.post('/favourite', postController.favouritePost);
PostRoute.post('/unfavourite', postController.unfavouritePost);
PostRoute.post('/comment', postController.addComment);
PostRoute.put('/comment', postController.updateComment);
PostRoute.delete('/comment', postController.deleteComment);
PostRoute.get('/comments/:postId', postController.getPostComments);
PostRoute.put('/state/:state/:postId', postController.changePostStatus);



PostRoute.get('/active', postController.getAllActivePosts);

module.exports = PostRoute;