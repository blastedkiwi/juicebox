const express = require("express");
const tagsRouter = express.Router();
const { getAllTags, getPostsByTagName } = require("../db");

tagsRouter.use((req, res, next) => {
  console.log("/tags, make us proud!");

  next();
});

tagsRouter.get("/", async (req, res) => {
  const tags = await getAllTags();

  res.send({
    tags,
  });
});

tagsRouter.get("/:tagName/posts", async (req, res, next) => {
  const { tagName } = req.params;
  //   console.log("this is tagname", tagName);
  try {
    if (tagName) {
      const postTags = await getPostsByTagName(tagName);
      // console.log("I AM POST TAGS", postTags);

      const posts = postTags.filter((postTag) => {
        // console.log("I AM SINGLE POST TAG", postTag.author.id);
        // console.log("I AM CAPTAIN NOW", req.user);
        return (
          postTag.active || (req.user && postTag.author.id === req.user.id)
        );
      });
      res.send({ posts });
    } else {
      next({
        name: "PostTagError",
        message: "ur post is not matchy with any tags",
      });
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

module.exports = tagsRouter;
