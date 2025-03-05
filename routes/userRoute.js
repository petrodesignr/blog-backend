const express = require('express');
const userRoute = express.Router();
const UserController = require('../controllers/userController');

// Route pour l'inscription
userRoute.post('/register', UserController.inscription);

// Route pour la connexion
userRoute.post('/login', UserController.connexion);

module.exports = userRoute;
