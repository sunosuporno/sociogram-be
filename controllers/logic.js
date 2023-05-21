const {
  storage,
  ref,
  uploadBytes,
  getDownloadURL,
} = require("../firebase/config.js");
const pool = require("../db/queries.js");
const fetch = require("node-fetch");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
uploadImage = upload.single("image");

const check = (req, res) => {
  res.status(200).json({ message: "Hello World" });
};

const getUser = async (req, res, next) => {
  const email = req.body.email;
  console.log(email);
  try {
    pool.query(
      `SELECT * FROM users WHERE email = '${email}'`,
      (error, results) => {
        if (error) {
          throw error;
        }
        res.status(200).json(results.rows[0]);
      }
    );
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  const id = req.params.id;
  console.log(id);
  try {
    pool.query(`SELECT * FROM users WHERE userid = ${id}`, (error, results) => {
      if (error) {
        throw error;
      }

      console.log(results.rows[0]);
      res.status(200).json(results.rows[0]);
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

function getRandomInteger() {
  return Math.floor(Math.random() * 600);
}

const createUser = async (req, res, next) => {
  const { name, email } = req.body;

  const client = await pool.connect();
  try {
    const id = getRandomInteger();
    const resUser = await client.query(
      `INSERT INTO users (userid, firstname, email) VALUES (${id}, '${name}', '${email}') RETURNING *`
    );
    const user = resUser.rows[0];
    console.log(user);
    res.status(200).json(user);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const uploadController = async (req, res, next) => {
  uploadImage(req, res, async (err) => {
    if (err) {
      return next(err);
    }

    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const fileRef = ref(storage, req.file.originalname);

    try {
      await uploadBytes(fileRef, req.file.buffer, {
        contentType: req.file.mimetype,
      });

      const downloadURL = await getDownloadURL(fileRef);
      res.status(200).send(downloadURL);
    } catch (error) {
      next(error);
    }
  });
};

const uploadProfilePic = async (req, res, next) => {
  uploadImage(req, res, async (err) => {
    const email = req.body.email;
    console.log("email", email);
    if (err) {
      return next(err);
    }

    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const fileRef = ref(storage, req.file.originalname);
    const client = await pool.connect();
    try {
      await uploadBytes(fileRef, req.file.buffer, {
        contentType: req.file.mimetype,
      });

      const downloadURL = await getDownloadURL(fileRef);
      console.log("downloadURL", downloadURL);
      const resUser = await client.query(
        `UPDATE users SET profilepicture = '${downloadURL}' WHERE email = '${email}' RETURNING *`
      );
      const user = resUser.rows[0];
      res.status(200).json({
        message: "Profile picture uploaded successfully",
        data: user,
        downloadURL: downloadURL,
      });
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  });
};

const uploadCoverPic = async (req, res, next) => {
  uploadImage(req, res, async (err) => {
    const email = req.body.email;
    console.log("email", email);
    if (err) {
      return next(err);
    }

    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const fileRef = ref(storage, req.file.originalname);
    const client = await pool.connect();
    try {
      await uploadBytes(fileRef, req.file.buffer, {
        contentType: req.file.mimetype,
      });

      const downloadURL = await getDownloadURL(fileRef);
      console.log("downloadURL", downloadURL);
      const resUser = await client.query(
        `UPDATE users SET coverphoto = '${downloadURL}' WHERE email = '${email}' RETURNING *`
      );
      const user = resUser.rows[0];
      res.status(200).json({
        message: "Cover picture uploaded successfully",
        data: user,
        downloadURL: downloadURL,
      });
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  });
};

const createPost = async (req, res, next) => {
  uploadImage(req, res, async (err) => {
    const userId = req.body.id;
    const caption = req.body.caption;
    if (err) {
      return next(err);
    }

    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const fileRef = ref(storage, req.file.originalname);
    const id = getRandomInteger();
    const client = await pool.connect();
    try {
      await uploadBytes(fileRef, req.file.buffer, {
        contentType: req.file.mimetype,
      });

      const downloadURL = await getDownloadURL(fileRef);
      console.log("downloadURL", downloadURL);
      const resPost = await client.query(
        `INSERT INTO posts (postid, userid, caption, imageurl) VALUES (${id}, ${userId}, '${caption}', '${downloadURL}') RETURNING *`
      );

      const post = resPost.rows[0];
      res.status(200).json({
        message: "New post created successfully",
        data: post,
        downloadURL: downloadURL,
      });
    } catch (error) {
      next(error);
    } finally {
      client.release();
    }
  });
};

//get all posts
const getPosts = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const resPosts = await client.query(`SELECT * FROM posts`);
    const posts = resPosts.rows;
    // for each post get the user firstname and profilepicture
    for (let i = 0; i < posts.length; i++) {
      const resUser = await client.query(
        `SELECT firstname, profilepicture FROM users WHERE userid = ${posts[i].userid}`
      );
      const user = resUser.rows[0];
      console.log(user);
      posts[i].firstName = user.firstname;
      posts[i].profilePicture = user.profilepicture;

      // for each post get the comments
      const resComments = await client.query(
        `SELECT * FROM comments WHERE postid = ${posts[i].postid}`
      );
      const comments = resComments.rows;
      posts[i].comments = comments;

      // for each comment get the user firstname and profilepicture
      for (let j = 0; j < comments.length; j++) {
        const resUser = await client.query(
          `SELECT firstname, profilepicture FROM users WHERE userid = ${comments[j].userid}`
        );
        const user = resUser.rows[0];
        comments[j].firstName = user.firstname;
        comments[j].profilePicture = user.profilepicture;

        // for each comment fix the date format
        const timestamp = new Date(comments[j].c_timestamp);
        const formattedDate = timestamp.toLocaleDateString("en-US", {
          day: "numeric",
          month: "long",
        });
        const formattedTime = timestamp.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        });
        comments[j].timestamp = formattedDate + " at " + formattedTime;
      }

      // for each post get the likes count
      const resLikes = await client.query(
        `SELECT COUNT(*) FROM likes WHERE postid = ${posts[i].postid}`
      );
      const likes = resLikes.rows[0].count;
      posts[i].likes = likes;

      // for each post get the liked status
      const resLiked = await client.query(
        `SELECT * FROM likes WHERE postid = ${posts[i].postid} AND userid = ${req.params.id}`
      );
      const liked = resLiked.rows[0];
      if (liked) {
        posts[i].isLiked = true;
      } else {
        posts[i].isLiked = false;
      }

      // for each post fix the date format
      const timestamp = new Date(posts[i].timestamp);
      const formattedDate = timestamp.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
      });
      const formattedTime = timestamp.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
      posts[i].timestamp = formattedDate + " at " + formattedTime;
    }
    res.status(200).json(posts);
  } catch (error) {
    console.log(error);
    next(error);
  } finally {
    client.release();
  }
};

//get posts by userid
const getPostsByUserId = async (req, res, next) => {
  const userId = req.params.id;
  const client = await pool.connect();
  try {
    const resPosts = await client.query(
      `SELECT * FROM posts WHERE userid = ${userId}`
    );
    const posts = resPosts.rows;
    for (let i = 0; i < posts.length; i++) {
      const resUser = await client.query(
        `SELECT firstname, profilepicture FROM users WHERE userid = ${posts[i].userid}`
      );
      const user = resUser.rows[0];
      console.log(user);
      posts[i].firstName = user.firstname;
      posts[i].profilePicture = user.profilepicture;

      // for each post get the comments
      const resComments = await client.query(
        `SELECT * FROM comments WHERE postid = ${posts[i].postid}`
      );
      const comments = resComments.rows;
      posts[i].comments = comments;

      // for each comment get the user firstname and profilepicture
      for (let j = 0; j < comments.length; j++) {
        const resUser = await client.query(
          `SELECT firstname, profilepicture FROM users WHERE userid = ${comments[j].userid}`
        );
        const user = resUser.rows[0];
        comments[j].firstName = user.firstname;
        comments[j].profilePicture = user.profilepicture;

        // for each comment fix the date format
        const timestamp = new Date(comments[j].c_timestamp);
        const formattedDate = timestamp.toLocaleDateString("en-US", {
          day: "numeric",
          month: "long",
        });
        const formattedTime = timestamp.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        });
        comments[j].timestamp = formattedDate + " at " + formattedTime;
      }

      // for each post get the likes count
      const resLikes = await client.query(
        `SELECT COUNT(*) FROM likes WHERE postid = ${posts[i].postid}`
      );
      const likes = resLikes.rows[0].count;
      posts[i].likes = likes;

      // for each post get the liked status
      const resLiked = await client.query(
        `SELECT * FROM likes WHERE postid = ${posts[i].postid} AND userid = ${req.body.id}`
      );
      const liked = resLiked.rows[0];
      if (liked) {
        posts[i].isLiked = true;
      } else {
        posts[i].isLiked = false;
      }

      // for each post fix the date format
      const timestamp = new Date(posts[i].timestamp);
      const formattedDate = timestamp.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
      });
      const formattedTime = timestamp.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
      posts[i].timestamp = formattedDate + " at " + formattedTime;
    }
    res.status(200).json(posts);
  } catch (error) {
    console.log(error);
    next(error);
  } finally {
    client.release();
  }
};

// add comment

const addComment = async (req, res, next) => {
  const { postId, userId, content } = req.body;

  const client = await pool.connect();
  try {
    const id = getRandomInteger();
    const resComment = await client.query(
      `INSERT INTO comments (commentid, postid, userid, content) VALUES (${id}, ${postId}, ${userId}, '${content}') RETURNING *`
    );
    const comment = resComment.rows[0];
    console.log(comment);

    // get all comments for the post
    const resComments = await client.query(
      `SELECT * FROM comments WHERE postid = ${postId}`
    );
    const comments = resComments.rows;
    console.log(comments);

    res.status(200).json(comments);
  } catch (error) {
    console.log(error);
    next(error);
  } finally {
    client.release();
  }
};

//get comments by postid
const getCommentsByPostId = async (req, res, next) => {
  const postId = req.params.id;
  const client = await pool.connect();
  try {
    const resComments = await client.query(
      `SELECT * FROM comments WHERE postid = ${postId}`
    );
    const comments = resComments.rows;
    res.status(200).json(comments);
  } catch (error) {
    console.log(error);
    next(error);
  } finally {
    client.release();
  }
};

const getLikesByPostId = async (req, res, next) => {
  const postId = req.params.id;

  try {
    const query = "SELECT COUNT(*) AS like_count FROM likes WHERE postid = $1";
    const values = [postId];

    // Execute the query using the connection pool
    const result = await pool.query(query, values);

    // Extract the like count from the query result
    const likeCount = result.rows[0].like_count;

    res.json({ postId, likeCount });
  } catch (error) {
    console.error("Error retrieving like count:", error);
    res.status(500).json({ error: "Unable to retrieve like count" });
  }
};

const likePost = async (req, res, next) => {
  const postId = req.params.id;
  const userId = req.body.userId;
  console.log("userId", userId);
  const likeId = getRandomInteger();
  try {
    const query =
      "INSERT INTO likes (likeid, postid, userid) VALUES ($1, $2, $3) RETURNING *";
    const values = [likeId, postId, userId];

    // Execute the query using the connection pool
    const result = await pool.query(query, values);

    // Extract the like count from the query result
    const like = result.rows[0];

    //current number of likes
    const query2 = "SELECT COUNT(*) AS like_count FROM likes WHERE postid = $1";
    const values2 = [postId];

    // Execute the query using the connection pool
    const result2 = await pool.query(query2, values2);

    // Extract the like count from the query result
    const likeCount = result2.rows[0].like_count;

    res.json({ postId, like, likeCount });
  } catch (error) {
    console.error("Error liking post:", error);
    res.status(500).json({ error: "Unable to like post" });
  }
};

const unlikePost = async (req, res, next) => {
  const postId = req.params.id;
  const userId = req.body.userId;

  try {
    const query =
      "DELETE FROM likes WHERE postid = $1 AND userid = $2 RETURNING *";
    const values = [postId, userId];

    // Execute the query using the connection pool
    const result = await pool.query(query, values);

    // Extract the like count from the query result
    const like = result.rows[0];

    //current number of likes
    const query2 = "SELECT COUNT(*) AS like_count FROM likes WHERE postid = $1";
    const values2 = [postId];
    const result2 = await pool.query(query2, values2);
    const likeCount = result2.rows[0].like_count;

    res.json({ postId, like, likeCount });
  } catch (error) {
    console.error("Error unliking post:", error);
    res.status(500).json({ error: "Unable to unlike post" });
  }
};

const isLikedByUser = async (req, res, next) => {
  const postId = req.params.postId;
  const userId = req.params.userId;

  try {
    const query =
      "SELECT EXISTS(SELECT 1 FROM likes WHERE postid = $1 AND userid = $2)";
    const values = [postId, userId];

    // Execute the query using the connection pool
    const result = await pool.query(query, values);

    // Check if the user has liked the post
    const hasLiked = result.rows[0].exists;

    res.json({ hasLiked });
  } catch (error) {
    console.error("Error checking if user has liked the post:", error);
    res
      .status(500)
      .json({ error: "Unable to check if user has liked the post" });
  }
};

const deletePostById = async (req, res, next) => {
  const postId = req.params.id;
  const client = await pool.connect();
  try {
    const resPost = await client.query(
      `DELETE FROM posts WHERE postid = ${postId} RETURNING *`
    );
    const post = resPost.rows[0];
    console.log(post);
    res.status(200).json(post);
  } catch (error) {
    console.log(error);
    next(error);
  } finally {
    client.release();
  }
};

module.exports = {
  check,
  uploadController,
  getUser,
  getUserById,
  createUser,
  uploadProfilePic,
  uploadCoverPic,
  createPost,
  getPosts,
  getPostsByUserId,
  addComment,
  getCommentsByPostId,
  getLikesByPostId,
  likePost,
  isLikedByUser,
  unlikePost,
  deletePostById,
};
