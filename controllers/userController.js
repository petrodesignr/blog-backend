const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

// Fonction d'inscription
const inscription = async (request, response) => {
    // récupération des données
    let { nom, prenom, email, password } = request.body;

    if (nom == "" || prenom == "" || email == "" || password == "") {
        return response.status(400).send({ message: "Veuillez remplir tous les champs" });
    }

    // validation de l'email avec une regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return response.status(400).send({ message: "Email invalide" });
    }

    // vérifier si l'email existe déjà dans la base de données
    userModel.checkEmailExists(email, (err, result) => {
        if (err) {
            return response.status(500).send({ message: "Erreur lors de la vérification de l'email" });
        }
        if (result.length > 0) {
            return response.status(400).send({ message: "Email déjà utilisé" });
        }

        // crypter le mot de passe
        bcrypt.hash(password, 5, (err, hashedPassword) => {
            if (err) {
                return response.status(500).send({ message: "Erreur lors du hashage du mot de passe" });
            }

            let values = [nom, prenom, email, hashedPassword];
            // appel de la méthode saveUser définie dans le userModel
            userModel.saveUser(values, (err, result) => {
                if (err) {
                    return response.status(500).send({ message: "Erreur lors de l'insertion" });
                }
                response.status(201).send({ message: "Inscription réalisée", id: result.insertId });
            });
        });
    });
}

// Fonction de connexion
const connexion = (request, response) => {
    let { email, password } = request.body;

    if (!email || !password) {
        return response.status(400).send({ message: "Veuillez fournir un email et un mot de passe" });
    }

    userModel.login(email, async (err, result) => {
        if (err) {
            return response.status(500).send({ message: "Erreur interne au serveur" });
        }
        if (result.length != 0) {
            let user = result[0];
            let passwordIsValid = await bcrypt.compare(password, user.password);
            if (!passwordIsValid) {
                return response.status(404).send({ message: "Email ou mot de passe incorrect" });
            }

            // génération du token
            let token = jwt.sign(
                { userId: user.id, email: user.email },
                process.env.SECRET_KEY,
                { expiresIn: "2h" }
            );
            return response.send({ message: "Connexion réussie", data: token });
        } else {
            return response.status(404).send({ message: "Email ou mot de passe incorrect" });
        }
    });
}

module.exports = {
    inscription,
    connexion
};
