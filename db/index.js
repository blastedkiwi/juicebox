const { Client } = require("pg");

const client = new Client("postgres://localhost:5432/juicebox-dev");

// client.connect().then(() => console.log('connected to juicebox-dev'));

const bcrypt = require("bcrypt");
const saltRounds = 10;

/*************** ONLY USERS GO HERE ***************/

const createUsers = async ({ username, password, name, location }) => {
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    // console.log("I AM HASHED POTATOES", hashedPassword);

    const {
      rows: [user],
    } = await client.query(
      `
        INSERT INTO users(username, password, name, location)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (username) DO NOTHING
        RETURNING *;
        `,
      [username, hashedPassword, name, location]
    );

    return user;
  } catch (error) {
    throw error;
  }
};

const getAllUsers = async () => {
  const { rows } = await client.query(`
    SELECT *
    FROM users;
    `);
  // console.log('ta-da! your rows: ', rows);
  return rows;
};

const updateUser = async (id, fields = {}) => {
  // console.log('them fields: ', fields);
  const setString = Object.keys(fields)
    .map((key, index) => `"${key}" = $${index + 1}`)
    .join(", ");
  if (setString.length === 0) {
    return;
  }
  try {
    const {
      rows: [user],
    } = await client.query(
      `
        UPDATE users
        SET ${setString}
        WHERE id = ${id}
        RETURNING *;
        `,
      Object.values(fields)
    );

    return user;
  } catch (error) {
    throw error;
  }
};

const getUserById = async (userId) => {
  try {
    const {
      rows: [user],
    } = await client.query(`
        SELECT * FROM users
        WHERE id = ${userId}
        `);

    if (!user) {
      return null;
    }

    user.posts = await getPostsByUser(userId);

    return user;
  } catch (error) {
    throw error;
  }
};

/*************** ONLY POSTS GO HERE ***************/

const createPosts = async ({ authorId, title, content, tags = [] }) => {
  try {
    const {
      rows: [post],
    } = await client.query(
      `
        INSERT INTO posts("authorId", title, content)
        VALUES ($1, $2, $3)
        RETURNING *;
        `,
      [authorId, title, content]
    );

    const tagList = await createTags(tags);

    return await addTagsToPosts(post.id, tagList);
  } catch (error) {
    throw error;
  }
};

const getAllPosts = async () => {
  const { rows } = await client.query(`
    SELECT *
    FROM posts;
    `);

  return rows;
};

const updatePost = async (postId, fields = {}) => {
  // console.log('them fields: ', fields);
  const { tags } = fields;
  delete fields.tags;

  const setString = Object.keys(fields)
    .map((key, index) => `"${key}" = $${index + 1}`)
    .join(", ");
  if (setString.length === 0) {
    return;
  }
  try {
    if (setString.length > 0) {
      await client.query(
        `
        UPDATE posts
        SET ${setString}
        WHERE id = ${postId}
        RETURNING *;
        `,
        Object.values(fields)
      );
    }

    if (tags === undefined) {
      return await getPostById(postId);
    }

    const tagList = await createTags(tags);
    const tagListIdString = tagList.map((tag) => `${tag.id}`).join(", ");

    await client.query(
      `
        DELETE FROM post_tags
        WHERE "tagId"
        NOT IN (${tagListIdString})
        AND "postId" = $1
        `,
      [postId]
    );

    await addTagsToPosts(postId, tagList);

    return await getPostById(postId);
  } catch (error) {
    throw error;
  }
};

const getPostById = async (postId) => {
  try {
    const {
      rows: [post],
    } = await client.query(
      `
        SELECT *
        FROM posts
        WHERE id = $1;
        `,
      [postId]
    );

    if (!post) {
      throw {
        name: "PostNotFoundError",
        message: "nah, dat post got no id",
      };
    }

    const { rows: tags } = await client.query(
      `
        SELECT tags.*
        FROM tags
        JOIN post_tags ON tags.id = post_tags."tagId"
        WHERE post_tags."postId" = $1
        `,
      [postId]
    );

    const {
      rows: [author],
    } = await client.query(
      `
        SELECT id, username, name, location
        FROM users
        WHERE id = $1
        `,
      [post.authorId]
    );

    post.tag = tags;
    post.author = author;
    // console.log('I AM AUTHOR', post);
    delete post.authorId;

    return post;
  } catch (error) {
    throw error;
  }
};

/*************** ONLY TAGS / POST_TAGS GO HERE ***************/

const createTags = async (tagList) => {
  if (tagList.length === 0) {
    return;
  }
  const insertValues = tagList.map((_, index) => `$${index + 1}`).join("), (");

  const selectValues = tagList.map((_, index) => `$${index + 1}`).join(", ");

  try {
    await client.query(
      `
        INSERT INTO tags(name)
        VALUES (${insertValues})
        ON CONFLICT (name) DO NOTHING;
        `,
      tagList
    );

    const { rows } = await client.query(
      `
        SELECT * FROM tags
        WHERE name
        IN (${selectValues});
        `,
      tagList
    );

    return rows;
  } catch (error) {
    throw error;
  }
};

const createPostTag = async (postId, tagId) => {
  try {
    await client.query(
      `
        INSERT INTO post_tags("postId", "tagId")
        VALUES ($1, $2)
        ON CONFLICT ("postId", "tagId") DO NOTHING
        `,
      [postId, tagId]
    );
  } catch (error) {
    throw error;
  }
};

const getAllTags = async () => {
  const { rows } = await client.query(`
    SELECT *
    FROM tags;
    `);
  // console.log('UR TAGS ARE HERE: ', rows)

  return rows;
};

/*************** HERE IS WHERE YOU GET THEM THINGS ALL AT ONCE ***************/

const getPostsByUser = async (userId) => {
  try {
    const { rows: postIds } = await client.query(`
        SELECT id FROM posts
        WHERE "authorId" = ${userId};
        `);

    const posts = await Promise.all(
      postIds.map((post) => getPostById(post.id))
    );

    return posts;
  } catch (error) {
    throw error;
  }
};

const addTagsToPosts = async (postId, tagList) => {
  try {
    const createPostTagPromises = tagList.map((tag) =>
      createPostTag(postId, tag.id)
    );

    await Promise.all(createPostTagPromises);

    return await getPostById(postId);
  } catch (error) {
    throw error;
  }
};

const getPostsByTagName = async (tagname) => {
  try {
    const { rows: postIds } = await client.query(
      `
        SELECT posts.id
        FROM posts
        JOIN post_tags ON posts.id = post_tags."postId"
        JOIN tags ON tags.id = post_tags."tagId"
        WHERE tags.name = $1;
        `,
      [tagname]
    );

    return await Promise.all(postIds.map((post) => getPostById(post.id)));
  } catch (error) {
    throw error;
  }
};

const getUserByUsername = async (username) => {
  try {
    const {
      rows: [user],
    } = await client.query(
      `
        SELECT *
        FROM users
        WHERE username = $1;
        `,
      [username]
    );

    return user;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  client,
  createUsers,
  getAllUsers,
  updateUser,
  createPosts,
  getAllPosts,
  updatePost,
  getPostById,
  createTags,
  createPostTag,
  getAllTags,
  addTagsToPosts,
  getPostsByUser,
  getUserById,
  getPostsByTagName,
  getUserByUsername,
};
