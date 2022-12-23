const express = require("express");
const postsRouter = express.Router();
const { getAllPosts, createPosts, updatePost, getPostById } = require("../db");
const { requireUser } = require("./utils");

postsRouter.use((req, res, next) => {
  console.log("/posts, ur turn!");

  next();
});

postsRouter.post("/", requireUser, async (req, res, next) => {
  const { title, content, tags = "" } = req.body;

  const tagArr = tags.trim().split(/\s+/);
  const postData = {};

  if (tagArr.length) {
    postData.tags = tagArr;
  }

  try {
    if (title && content) {
      postData.authorId = req.user.id;
      postData.title = title;
      postData.content = content;
    }

    const post = await createPosts(postData);

    if (post) {
      res.send({ post });
    } else {
      next({
        name: "CreatingPostError",
        message: "cannot make u post",
      });
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

postsRouter.get("/", async (req, res, next) => {
  try {
    const allPosts = await getAllPosts();

    const posts = allPosts.filter((post) => {
      //   console.log("I AM AUTHOR ID", post.authorId);
      //   console.log("I AM USER ID", req.user.id);
      return post.active || (req.user && post.authorId === req.user.id);
    });

    res.send({
      posts,
    });
  } catch ({ name, message }) {
    next({ name, message });
  }
});

postsRouter.patch("/:postId", requireUser, async (req, res, next) => {
  const { postId } = req.params;
  const { title, content, tags } = req.body;

  const updateFields = {};

  if (tags && tags.length > 0) {
    updateFields.tags = tags.trim().split(/\s+/);
  }

  if (title) {
    updateFields.title = title;
  }

  if (content) {
    updateFields.content = content;
  }

  try {
    const originalPost = await getPostById(postId);

    if (originalPost.author.id === req.user.id) {
      const updatedPost = await updatePost(postId, updateFields);
      res.send({ post: updatedPost });
    } else {
      next({
        name: "UnauthorizedUserError",
        message: "fraud! u cannot change this post",
      });
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

postsRouter.delete("/:postId", requireUser, async (req, res, next) => {
  try {
    const post = await getPostById(req.params.postId);

    if (post && post.author.id === req.user.id) {
      const updatedPost = await updatePost(post.id, { active: false });

      res.send({ post: updatedPost });
    } else {
      next(
        post
          ? {
              name: "UnauthorizedUserError",
              message: "nope, not ur post! u cannot deleto",
            }
          : {
              name: "PostNotFoundError",
              message: "i got no post like that, honey",
            }
      );
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

module.exports = postsRouter;
