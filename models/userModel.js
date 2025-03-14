const environement = require('dotenv');
environement.config();
const connexion = require('../config/db');
//rajouter role
// enregistrer un user
const saveUser = (values, callback) => {
    let req = `INSERT INTO users (nom, prenom, email, password) VALUES (?,?,?,?)`;
    connexion.query(req, values, (err, res) => {
        callback(err, res)
    });
}
// connecter un user
const login = (email, callback) => {
    let sql = "SELECT * FROM users WHERE email = ?";
    connexion.query(sql, [email], (err, res) => {
        callback(err, res)
    });
}

// vérifier si l'email existe déjà
const checkEmailExists = (email, callback) => {
    let sql = "SELECT * FROM users WHERE email = ?";
    connexion.query(sql, [email], (err, res) => {
        callback(err, res);
    });
}

const makeadmin = (role, id, callback) => {
    let sql = "UPDATE users SET role = ? WHERE id = ?"
    connexion.query(sql, [role, id], (err, res) => {
        callback(err, res);
    })
}

const getAllUsers = (callback) => {
    let sql = "SELECT id, nom, prenom, email, role FROM users"; // Fetch users without passwords
    connexion.query(sql, (err, res) => {
        callback(err, res);
    });
};

module.exports = {
    saveUser,
    login,
    checkEmailExists,
    makeadmin,
    getAllUsers
};