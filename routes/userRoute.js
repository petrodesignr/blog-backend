const express = require('express');
const userRoute = express.Router();
const UserController = require('../controllers/userController');

// Route pour l'inscription
userRoute.post('/register', UserController.inscription);

// Route pour la connexion
userRoute.post('/login', UserController.connexion);

//Route to make an admin
userRoute.put('/makeadmin', UserController.promoteToAdmin);

// Route to get all users
userRoute.get("/users", UserController.fetchAllUsers); 

module.exports = userRoute;
