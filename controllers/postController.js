const jwt = require('jsonwebtoken');
const postModel = require('../models/postModel');
const { request, response } = require('express');
const multer = require('multer');

// Configurer Multer pour la gestion des images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/'); // Enregistrer l'image dans le dossier 'uploads'
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Utiliser un nom de fichier unique basé sur le timestamp
    }
});

const upload = multer({ storage: storage });

// Ajouter un post avec une image et un lien
const addPost = (request, response) => {
    // Télécharger l'image d'abord avec multer
    upload.single('image')(request, response, (err) => {
        if (err) {
            return response.status(500).send({ message: 'Erreur lors du téléchargement de l\'image' });
        }

        // Récupérer les autres données du post (titre, description, lien)
        let { titre, description, link } = request.body;
        // Vérifier si une image a été téléchargée et récupérer son chemin
        let image = request.file ? `uploads/${request.file.filename}` : null;

        console.log(request.body)
        // Vérifier si le token est inclus dans l'entête de la requête
        let tokenIsInclude = request.headers.authorization;
        if (!tokenIsInclude) {
            return response.send("Le token n'est pas présent. Veuillez vous connecter pour obtenir votre token");
        }

        let transform = tokenIsInclude.split(' ');
        let token = transform[1];

        // Vérifier la validité du token
        jwt.verify(token, process.env.SECRET_KEY, (err, result) => {
            if (err) {
                return response.send("Le token n'est pas valide ou il est expiré");
            }

            // Si le token est valide, on extrait l'ID de l'utilisateur
            let userId = result.userId;

            // Sauvegarder le post dans la base de données
            postModel.savePost([titre, description, userId, image, link], (e, r) => {
                if (e) {
                    return response.send("Erreur lors de l'insertion du post");
                }
                return response.send({ "message": "Post ajouté avec succès" });
            });
        });
    });
};

// recuperer un post via son identifiant
const getPost = (request, response) => {
    const postId = request.params.id; // Fix: Use 'request' instead of 'req'
    const token = request.headers.authorization?.split(' ')[1];

    let userId = null;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.id; // Assuming token payload has 'id'
        } catch (err) {
            console.error('Invalid token:', err);
        }
    }

    postModel.getPostById(postId, userId, (err, result) => {
        if (err) {
            return response.status(500).json({ error: 'Database error' }); // Fix: Use 'response' instead of 'res'
        }
        if (!result) {
            return response.status(404).json({ error: 'Post not found' }); // Fix: Use 'response' instead of 'res'
        }
        response.json(result); // Fix: Use 'response' instead of 'res'
    });
};


// recuperer tous les posts
const getAllPosts = (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]; // Extract Bearer token
    let userId = null;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.id; // Assuming your JWT payload has 'id'
        } catch (err) {
            console.error('Invalid token:', err);
        }
    }
    postModel.getAllPosts(userId, (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ list: result });
    });
};

// methode pour supprimer un post
const deletePost = (request, response) => {
    let id =request.params.id;

    postModel.deletePost(id, (error, result) => {
        if(error){
            response.send({"message":"erreur interne"});
            return;
        }
        response.send({message: "Post supprime"});
    })
}

// methode pour la modification d'un post
const updatePost = (request, response) => {
    upload.single("image")(request, response, (err) => {
        if (err) {
            return response.status(500).send({ message: "Erreur lors du téléchargement de l'image" });
        }

        let { titre, description, link } = request.body;
        let id = Number(request.body.id); // Convert ID to a number
        let image = request.file ? `uploads/${request.file.filename}` : '';

        if (!link) link = '';

        console.log("Data types:", {
            id: typeof request.body.id,
            titre: typeof request.body.titre,
            description: typeof request.body.description,
            image: typeof image,
            link: typeof link
          });

          console.log(request.body);


        if (isNaN(id) || id <= 0) {
            return response.status(400).send({ message: "ID invalide" });
        }

        console.log("Request body:", request.body);
        
        // Vérifier si le token est présent
        let tokenIsInclude = request.headers.authorization;
        if (!tokenIsInclude) {
            return response.status(401).send("Le token n'est pas présent. Veuillez vous connecter.");
        }

        let token = tokenIsInclude.split(" ")[1];

        jwt.verify(token, process.env.SECRET_KEY, (err, result) => {
            if (err) {
                return response.status(401).send("Le token n'est pas valide ou expiré.");
            }

            // Vérifier si l'utilisateur est bien le propriétaire du post
            postModel.getPostById(id, result.userId, (err, res) => {
                if (err || res.length === 0) {
                    return response.status(404).send("Post introuvable.");
                }

                let post = res;

                console.log(post);
                if (post.userId !== result.userId) {
                    return response.status(403).send("Vous n'avez pas le droit de modifier ce post.");
                }

                // Si pas de nouvelle image, garder l'ancienne
                if (!image) {
                    image = post.image;
                }

                /// Ensure values are valid before updating
                if (typeof titre !== "string" || typeof description !== "string" || (link !== null && typeof link !== "string")) {
                    return response.status(400).send({ message: "Titre, description et link doivent être des chaînes de caractères." });
                }

                console.log("Updating post with values:", [titre, description, image, link, id]);

                // Mettre à jour le post
                postModel.updatePost([titre, description, image, link, id], (e, r) => {
                    if (e) {
                        console.error("SQL Error:", e);
                        return response.status(500).send("Erreur lors de la mise à jour.");
                    }
                    response.send({ message: "Post mis à jour avec succès" });
                });
            });
        });
    });
};


// methode pour recuperer la liste des posts d'un utilisateur
const getUserPost = (request, response) => {
    let token = request.headers.authorization;
    console.log(token + ' ' + token.split(" ")[1]);
    token = token.split(" ")[1];
    jwt.verify(token, process.env.SECRET_KEY, (err, result) => {
        if(err){
            response.send({"message":"le token n'est pas valide ou expire"});
            return;
        }else{
            postModel.getUserPost(result.userId, (err, res) => {
                if(err){
                    response.send({"message":"erreur interne"});
                    return;
                }
                response.send(res);
            })
        }
    })
}

// Middleware to get user ID from token
const getUserIdFromToken = (request) => {
    let token = request.headers.authorization;
    if (!token) return null;
    token = token.split(" ")[1];

    try {
        let decoded = jwt.verify(token, process.env.SECRET_KEY);
        return decoded.userId;
    } catch (err) {
        return null;
    }
};

// Recuperer les likes d'un post
const getLike = (request, response) => {
    const userId = getUserIdFromToken(request);
    if (!userId) {
        response.send({ "message": "Token invalide ou expiré" });
        return;
    }

    postModel.getLike(userId, (err, res) => {
        if (err) {
            response.send({ "message": "Erreur interne" });
            return;
        }
        response.send(res);
    });
}

// ajouter un like
const likePost = (request, response) => {
    let userId = getUserIdFromToken(request);
    if (!userId) {
        response.send({ "message": "Token invalide ou expiré" });
        return;
    }

    let { postId } = request.body;
    postModel.addLike([userId, postId], (err, res) => {
        if (err) {
            console.log(err);
            response.send({ "message": err });
            return;
        }
        response.send({ "message": "Post liké avec succès" });
    });
};

// supprimer un like
const unlikePost = (request, response) => {
    let userId = getUserIdFromToken(request);
    if (!userId) {
        response.send({ "message": "Token invalide ou expiré" });
        return;
    }

    let { postId } = request.body;
    postModel.removeLike([userId, postId], (err, res) => {
        if (err) {
            response.send({ "message": "Erreur interne" });
            return;
        }
        response.send({ "message": "Like supprimé" });
    });
};

// ajouter un post aux favoris
const favouritePost = (request, response) => {
    let userId = getUserIdFromToken(request);
    if (!userId) {
        response.send({ "message": "Token invalide ou expiré" });
        return;
    }

    let { postId } = request.body;
    postModel.addFavourite([userId, postId], (err, res) => {
        if (err) {
            response.send({ "message": "Erreur interne" });
            return;
        }
        response.send({ "message": "Post ajouté aux favoris" });
    });
};

// supprimer un post des favoris
const unfavouritePost = (request, response) => {
    let userId = getUserIdFromToken(request);
    if (!userId) {
        response.send({ "message": "Token invalide ou expiré" });
        return;
    }

    let { postId } = request.body;
    postModel.removeFavourite([userId, postId], (err, res) => {
        if (err) {
            response.send({ "message": "Erreur interne" });
            return;
        }
        response.send({ "message": "Post retiré des favoris" });
    });
};

// ajouter un commentaire
const addComment = (request, response) => {
    let userId = getUserIdFromToken(request);
    if (!userId) {
        response.send({ "message": "Token invalide ou expiré" });
        return;
    }

    let { postId, commentaire } = request.body;
    // console.log('addComment - Input:', { userId, postId, commentaire }); // Log inputs

    postModel.addComment([userId, postId, commentaire], (err, res) => {
        if (err) {
            console.error('addComment - Database Error:', err); // Log the error
            response.send({ "message": "Erreur interne", "error": err.message });
            return;
        }
        response.send({ "message": "Commentaire ajouté" });
    });
};

// modifier un commentaire
const updateComment = (request, response) => {
    let userId = getUserIdFromToken(request);
    if (!userId) {
        response.send({ "message": "Token invalide ou expiré" });
        return;
    }

    let { commentId, commentaire } = request.body;
    postModel.updateComment([commentaire, commentId, userId], (err, res) => {
        if (err) {
            response.send({ "message": "Erreur interne" });
            return;
        }
        if (res.affectedRows === 0) {
            response.send({ "message": "Modification refusée. Soit le commentaire n'existe pas, soit vous n'êtes pas son auteur" });
            return;
        }
        response.send({ "message": "Commentaire modifié avec succès" });
    });
};

// supprimer un commentaire
const deleteComment = (request, response) => {
    let userId = getUserIdFromToken(request);
    if (!userId) {
        response.send({ "message": "Token invalide ou expiré" });
        return;
    }

    let { commentId } = request.body;
    postModel.deleteComment([commentId, userId], (err, res) => {
        if (err) {
            response.send({ "message": "Erreur interne" });
            return;
        }
        if (res.affectedRows === 0) {
            response.send({ "message": "Suppression refusée. Soit le commentaire n'existe pas, soit vous n'êtes pas son auteur" });
            return;
        }
        response.send({ "message": "Commentaire supprimé avec succès" });
    });
};

// recuperer les commentaires d'un post
const getPostComments = (request, response) => {
    let postId = request.params.postId;
    postModel.getCommentsByPost(postId, (err, res) => {
        if (err) {
            console.error('Database Error:', err);  // Log the error
            response.status(500).send({ "message": "Erreur interne" });
            return;
        }
        if (res.length === 0) {
            response.send({ "message": "No comments found" });
            return;
        }
        response.send(res);
    });
};


module.exports = {
    addPost,
    getPost,
    getAllPosts,
    deletePost,
    updatePost,
    getUserPost,
    getLike,
    likePost,
    unlikePost,
    favouritePost,
    unfavouritePost,
    addComment,
    updateComment,
    deleteComment,
    getPostComments
}