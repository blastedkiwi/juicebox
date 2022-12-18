const { client,
    createUsers,
    getAllUsers,
    updateUser,
    createPosts,
    getAllPosts,
    updatePost,
    getPostsByTagName,
    getUserById,
} = require('./index');

/*************** WOODWORKING TABLES HERE ***************/

const dropTables = async () => {
    try {
        console.log('drop em tables');
        await client.query(`

        DROP TABLE IF EXISTS post_tags;

        DROP TABLE IF EXISTS tags;

        DROP TABLE IF EXISTS posts;

        DROP TABLE IF EXISTS users;
        `)
        console.log('u got 0 tables');

    } catch (error) {
        console.error('error! try singing Turning Tables instead');
        throw error;
    }
}

const createTables = async () => {
    try {
        console.log('u want em tables?');

        await client.query(`
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            location VARCHAR(255) NOT NULL,
            active BOOLEAN DEFAULT true
        );
      
        CREATE TABLE posts (
            id SERIAL PRIMARY KEY,
            "authorId" INTEGER REFERENCES users(id) NOT NULL,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            active BOOLEAN DEFAULT true
        );

        CREATE TABLE tags (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL
        );

        CREATE TABLE post_tags (
            "postId" INTEGER REFERENCES posts(id),
            "tagId" INTEGER REFERENCES tags(id),
            UNIQUE ("postId", "tagId")
        );

        `);
        
        console.log('u got em tables');

    } catch (error) {
        console.error('error! im not a carpenter, cannot make u tables');
        throw error;
    }
}

/*************** ONLY USERS GO HERE ***************/

const createInitUsers = async () => {
    try {
        console.log("so, you're trying to make new users..?");
        await createUsers
            ({ username: 'albert', password: 'bertie99', name: 'albert', location: 'asteriod B-612' });
        
        await createUsers
            ({ username: 'sandra', password: '2sandy4me', name: 'cassandra', location: 'ancient greece' });
        
        await createUsers
            ({ username: 'glamgal', password: 'soglam', name: 'elle woods', location: 'harvard law' });
        
        // console.log('im original albert: ', albert);
        // console.log('im sandra: ', sandra);
        // console.log('im glamgal: ', glamgal);

        console.log('ta-da! congrats, u made some users!');
    } catch (error) {
        console.error('error! nope, no users were made here...');
        throw error;
    }
}

/*************** ONLY POSTS GO HERE ***************/

const createInitPosts = async () => {
    try {
        console.log("making blogs is on the rise...");

        const [albert, sandra, glamgal] = await getAllUsers();

        await createPosts
            ({
                authorId: albert.id,
                title: "Blogging 101",
                content: "Hi guys, welcome to my blog! Everyone is fairly new here, including me! So, what do you want to know about me? Hmu and lmk!",
                tags: ["#ecstatic", "#AlwaysCarpeDiem-ing"]
            });
    
        await createPosts
            ({
                authorId: sandra.id,
                title: "Ancient Greece -- WTF??",
                content: "I really had no plans of making a blog whatsoever -- until my trip to Ancient Greece. The drama, the tragedy, thE CONSPIRACY AND BACKSTABBING?? Subscribe to my blog for more!",
                tags: ["#whatinthebaklava", "#AlwaysCarpeDiem-ing"]
            });
        
        await createPosts
            ({
                authorId: glamgal.id,
                title: "How To Get Into Harvard Law, in FULL GLAM!",
                content: "Hi there, Elle Woods here! Recently graduated top of my class in Harvard Law, can you believe it?? Read on to find out how to do just that, and in your fave shade of pink and stilettos!",
                tags: ["#ecstatic", "#harvardlawqueen", "#AlwaysCarpeDiem-ing"]
            });
        
        console.log('some new fresh blogs here for u!');
    } catch (error) {
        console.error('error! no more posts for u!');
        throw error;
    }
}


/*************** DATABASE REBUILDING ***************/

const testDB = async () => {
        try {
            console.log('testing ur database...');

            //invoking getAllUsers function
            console.log('lez getAllUsers!')
            const users = await getAllUsers();
            console.log('all ur users: ', users);
            
            //invoking updateUser func to make some changes
            console.log('updateUser, i choose u! change users[0]')
            const updateUserRes = await updateUser(users[1].id, {
            name: 'cassandra',
            location: 'ancient greece'
            });
            console.log('sweet! u changed these: ', updateUserRes);

            //invoking getAllPosts function
            console.log('getAllPosts, u r up!')
            const posts = await getAllPosts();
            console.log('all ur posts: ', posts);

            // invoking updatePosts func to make some changes
            console.log('round 1! updatePosts change posts[1]')
            const updatePostRes = await updatePost(posts[1].id, {
                tags: ['#AlwaysCarpeDiem-ing', '#lolwhat', '#sodone']
            });
            console.log('u changed this post. why? ', updateUserRes);

            //getting user by their id
            console.log('hu is dat user 1??')
            const albert = await getUserById(1);
            console.log('i am user 1 *snaps fingers* ', albert);

            //getting post by tag name
            console.log('testing getPostByName with #ecstatic, pls work!!!');
            const postsWithHappy = await getPostsByTagName("#ecstatic");
            console.log("did it work?", postsWithHappy);

            console.log('this database scored 100%, nice!');
    
        } catch (error) {
            console.error('error! database got zilch, try again!'); 
            throw error;
        }
    }
    
const rebuildDB = async () => {
        try {
            await client.connect();
    
            await dropTables();
            await createTables();
            await createInitUsers();
            await createInitPosts();
            await testDB();
        } catch (error) {
            console.error('error! no rebuilding happened here :(');
            throw error;
        } finally {
            client.end();
        }
    };
    
rebuildDB();