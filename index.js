// Importation des modules requis
const express = require('express'); // Framework Express
const path = require('path');
const cors = require('cors'); // CORS pour le partage de ressources entre origines
const dotenv = require('dotenv'); // Charger les variables d'environnement
const UserRoute = require('./routes/userRoute');
const PostRoute = require('./routes/postRoute');

// Charger les variables d'environnement depuis le fichier .env
dotenv.config();

// Création de l'instance de l'application Express
const app = express();

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware
app.use(express.json()); // Parser automatiquement les requêtes JSON
app.use(cors()); // Activer CORS pour toutes les routes

// Routes
app.use('/user', UserRoute); // Routes utilisateur
app.use('/post', PostRoute); // Routes des posts

// Route par défaut (pour les tests ou futures extensions)
app.get('/', (req, res) => {
    res.send('Bienvenue sur l\'API Blog');
});

// Middleware global pour la gestion des erreurs (optionnel mais recommandé)
app.use((err, req, res, next) => {
    console.error(err.stack); // Log l'erreur pour le débogage
    res.status(500).send({ message: 'Quelque chose a mal tourné sur le serveur.' });
});

// Définir le port (depuis une variable d'environnement, avec une valeur par défaut à 3000)
const PORT = process.env.PORT || 3000;

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur en marche sur le port ${PORT}`);
});
