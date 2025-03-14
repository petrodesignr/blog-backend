const environement = require('dotenv');
environement.config();
const connexion = require('../config/db');
//rajouter etat
// methode pour sauvegarder un post avec image et lien
const savePost = (values, callback) => {
    let req = "INSERT INTO posts (titre, description, userId, image, link, state) VALUES (?, ?, ?, ?, ?, ?)";
    connexion.query(req, values, (err, res) => {
        callback(err, res);
    });
}
// methode pour recuperer un post via son id
const getPostById = (id, userId, callback) => {
    let req = `
        SELECT 
            users.nom, 
            users.prenom, 
            posts.titre, 
            posts.description, 
            posts.id, 
            posts.image, 
            posts.link, 
            posts.createdAt, 
            COUNT(likes.postId) AS likeCount, 
            MAX(CASE WHEN likes.userId = ? THEN 1 ELSE 0 END) AS isLikedByUser, 
            posts.userId 
        FROM 
            users 
        INNER JOIN 
            posts ON users.id = posts.userId 
        LEFT JOIN 
            likes ON posts.id = likes.postId 
        WHERE 
            posts.id = ? 
        GROUP BY 
            posts.id, users.nom, users.prenom, posts.titre, posts.description, posts.image, posts.link, posts.createdAt, posts.userId
    `;
    connexion.query(req, [userId || null, id], (err, res) => {
        if (err) {
            console.error('Error fetching post by ID:', err);
            callback(err, null);
        } else {
            callback(null, res[0]);
        }
    });
};

const getAllActivePosts = (userId, state, callback) => {
    let sql = `SELECT 
            posts.id, 
            posts.titre, 
            posts.description, 
            posts.image, 
            posts.link, 
            posts.createdAt, 
            users.nom, 
            users.prenom, 
            COUNT(likes.postId) AS likeCount,
            MAX(CASE WHEN likes.userId = ? THEN 1 ELSE 0 END) AS isLikedByUser
        FROM 
            posts 
        JOIN 
            users ON posts.userId = users.id 
        LEFT JOIN 
            likes ON posts.id = likes.postId 
        WHERE posts.state = ?
        GROUP BY 
            posts.id, posts.titre, posts.description, posts.image, posts.link, posts.createdAt, users.nom, users.prenom 
        ORDER BY 
            posts.createdAt DESC
        `
        connexion.query(sql, [userId || null, state], (err, res) => {
            callback(err, res);
        });
}

// methode pour recuperer la liste des posts
const getAllPosts = (userId, callback) => {
    let sql = `
        SELECT 
            posts.id, 
            posts.titre, 
            posts.description, 
            posts.image, 
            posts.link, 
            posts.createdAt, 
            users.nom, 
            users.prenom, 
            COUNT(likes.postId) AS likeCount,
            MAX(CASE WHEN likes.userId = ? THEN 1 ELSE 0 END) AS isLikedByUser
        FROM 
            posts 
        JOIN 
            users ON posts.userId = users.id 
        LEFT JOIN 
            likes ON posts.id = likes.postId 
        GROUP BY 
            posts.id, posts.titre, posts.description, posts.image, posts.link, posts.createdAt, users.nom, users.prenom 
        ORDER BY 
            posts.createdAt DESC
    `;
    connexion.query(sql, [userId || null], (err, res) => {
        callback(err, res);
    });
};

// methode pour supprimer un post
const deletePost = (id, callback) => {
    let sql = "DELETE FROM posts WHERE id = ?";
    connexion.query(sql, [id], (err, res) => {
        callback(err, res);
    })
}
//rajouter etat

// méthode pour modifier un post avec image et lien
const updatePost = (values, callback) => {
  
    let sql =
      "UPDATE posts SET titre = ?, description = ?, image = ?, link = ?, state = ? WHERE id = ?";
    connexion.query(sql, values , (err, res) => {
      if (err) {
        console.error("SQL Error:", err);
      }
      callback(err, res);
    });
  };


// recuperation de la liste des posts d'un utilisateur
const getUserPost = (id, callback) => {
    let sql = "SELECT * FROM posts WHERE userId = ? ORDER BY posts.createdAt DESC";
    connexion.query(sql, id, (err, res) => {
        callback(err, res);
    })
}
//recuperer les likes
const getLike = (userId, callback) => {
    let sql = "SELECT postId FROM likes WHERE userId = ?"
    connexion.query(sql, userId, (err, res) => {
        callback(err, res)
    });
}

// ajouter un like
const addLike = (values, callback) => {
    let sql = "INSERT INTO likes (userId, postId) VALUES (?, ?)";
    // let sql = "UPDATE posts set isLiked = ? where postId = ?"
    connexion.query(sql, values, (err, res) => {
        callback(err, res);
    });
}

// supprimer un like
const removeLike = (values, callback) => {
    let sql = "DELETE FROM likes WHERE userId = ? AND postId = ?";
    // let sql = "UPDATE posts set isLiked = ? where postId = ?"
    connexion.query(sql, values, (err, res) => {
        callback(err, res);
    });
}

// ajouter un post aux favoris
const addFavourite = (values, callback) => {
    let sql = "INSERT INTO favourites (userId, postId) VALUES (?, ?)";
    connexion.query(sql, values, (err, res) => {
        callback(err, res);
    });
}

// supprimer un post des favoris
const removeFavourite = (values, callback) => {
    let sql = "DELETE FROM favourites WHERE userId = ? AND postId = ?";
    connexion.query(sql, values, (err, res) => {
        callback(err, res);
    });
}

// ajouter un commentaire
const addComment = (values, callback) => {
    let sql = "INSERT INTO comments (userId, postId, commentaire) VALUES (?, ?, ?)";
    connexion.query(sql, values, (err, res) => {
      if (err) {
        console.error('addComment - Query Error:', err);
        return callback(err, null);
      }
      // Fetch the newly created comment
      const newCommentId = res.insertId;
      let fetchSql = `
        SELECT comments.id, users.nom, users.prenom, comments.commentaire, comments.createdAt 
        FROM comments 
        JOIN users ON comments.userId = users.id 
        WHERE comments.id = ?
      `;
      connexion.query(fetchSql, [newCommentId], (fetchErr, fetchRes) => {
        if (fetchErr) {
          console.error('Error fetching new comment:', fetchErr);
          return callback(fetchErr, null);
        }
        callback(null, { message: 'Comment added successfully', comment: fetchRes[0] });
      });
    });
  };

// modifier un commentaire
const updateComment = (values, callback) => {
    let sql = "UPDATE comments SET commentaire = ? WHERE id = ? AND userId = ?";
    connexion.query(sql, values, (err, res) => {
        callback(err, res);
    });
};

// supprimer un commentaire
const deleteComment = (values, callback) => {
    let sql = "DELETE FROM comments WHERE id = ? AND userId = ?";
    connexion.query(sql, values, (err, res) => {
        callback(err, res);
    });
};

// recuperer les commentaires d'un post
const getCommentsByPost = (postId, callback) => {
    let sql = "SELECT comments.id, users.nom, users.prenom, comments.commentaire, comments.createdAt FROM comments INNER JOIN users ON users.id = comments.userId WHERE comments.postId = ? ORDER BY comments.createdAt DESC";
    connexion.query(sql, [postId], (err, res) => {
        callback(err, res);
    });
};

const changePostStatus = (values, callback) => {
    const sql = "UPDATE posts SET state = ? WHERE id = ?";
    connexion.query(sql, values, (err, res) => {
        callback(err, res);
    });
}

module.exports = {
    savePost,
    getPostById,
    getAllActivePosts,
    getAllPosts,
    deletePost,
    updatePost,
    getUserPost,
    getLike,
    addLike,
    removeLike,
    addFavourite,
    removeFavourite,
    addComment,
    updateComment,
    deleteComment,
    getCommentsByPost,
    changePostStatus
};