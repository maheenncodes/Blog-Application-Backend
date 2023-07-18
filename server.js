const express = require("express");
const app = express();
const mongoose = require("mongoose");


app.use(express.json());

// Database Connection
(async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/app", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connection Successful");
  } catch (err) {
    console.error("Cannot Connect:", err);
  }
})();

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  pass: String,
},
{ collection: "users" }
);

const postSchema = new mongoose.Schema({
    title: String,
    content: String,
    author: String,
    comments: [
      {
        content: String,
        author: String,
      }
    ]
  }, { collection: 'posts' });
const userModel = mongoose.model("User", userSchema);
const postModel = mongoose.model("Post", postSchema);


// Get All Users
app.get("/users", async (req, res) => {
    try {
      const users = await userModel.find();
      res.status(200).json(users);
    } catch (err) {
      console.error("Failed to retrieve users:", err);
      res.status(500).json({ error: "Failed to retrieve users" });
    }
  });

// Register User
app.post("/register", async (req, res) => {
    const { name, email, pass } = req.body;
  
    try {
      const existingUser = await userModel.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ error: "Email already exists" });
      }
  
      const newUser = new userModel({ name, email, pass });
      const savedUser = await newUser.save(); // Save the user and get the saved document
  
      res.status(201).json({ message: "User registered successfully", user: savedUser });
    } catch (err) {
      console.error("Failed to register user:", err);
      res.status(500).json({ error: "Failed to register user" });
    }
  });
  

  let loggedInUser = null;

  //
  app.get("/logout", async (req, res) => {
    loggedInUser = null;
    res.status(201).json({ message: "User logged Out"});
  });

// User Login
app.post("/login", async (req, res) => {
  const { email, pass } = req.body;

    
   

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    if (user.pass === req.body.pass.toString()) {
        
        loggedInUser =user;
         res.status(200).json({ message: "Login successful" });
      
    }
    else{
        return res.status(401).json({ error: "Invalid password" });
    }

   
    
  } catch (err) {
    console.error("Failed to login:", err);
    res.status(500).json({ error: "Failed to login" });
  }
});

// Update User Profile'


app.put("/profile", async (req, res) => {
    const { name, email, pass } = req.body;
    
    try {
      
  
      const updatedUser = await userModel.findByIdAndUpdate(
        loggedInUser._id,
        { name, email, pass },
        { new: true }
      );
  
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
  
      loggedInUser = updatedUser;
      res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
    } catch (err) {
      console.error("Failed to update user profile:", err);
      res.status(500).json({ error: "Failed to update user profile" });
    }
  });
  

//Create a Post
app.post("/createPost", async (req, res) => {
    const { title, content } = req.body;
  
    try {
      const newPost = new postModel({ title, content, author: loggedInUser._id });
      const savedPost = await newPost.save();
  
      res.status(201).json({ message: "Post created successfully", post: savedPost });
    } catch (err) {
      console.error("Failed to create post:", err);
      res.status(500).json({ error: "Failed to create post" });
    }
  });
  
//read all posts
  app.get("/posts", async (req, res) => {
    try {
      const posts = await postModel.find();
      
      res.status(200).json(posts);
    } catch (err) {
      console.error("Failed to retrieve posts:", err);
      res.status(500).json({ error: "Failed to retrieve posts" });
    }
  });


  

   


  //read one post
  app.get("/posts/:postId", async (req, res) => {
    const { postId } = req.params;
  
    try {
      const post = await postModel.findById(postId);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
  
      res.status(200).json(post);
    } catch (err) {
      console.error("Failed to retrieve post:", err);
      res.status(500).json({ error: "Failed to retrieve post" });
    }
  });
  
  //update post

  app.put("/posts/:postId", async (req, res) => {
    const { postId } = req.params;
    const { title, content } = req.body;
  
    try {
      const updatedPost = await postModel.findById(postId);
  
      if (!updatedPost) {
        return res.status(404).json({ error: "Post not found" });
      }
      if(loggedInUser._id !== updatedPost.author){
        return res.status(404).json({ error: "Cannot Update! You are Not the Author" });
      }

      const updatedPost2 = await postModel.findByIdAndUpdate(
        postId,
        { title, content },
        { new: true }
      );
  
      res.status(200).json({ message: "Post updated successfully", post: updatedPost2 });
    } catch (err) {
      console.error("Failed to update post:", err);
      res.status(500).json({ error: "Failed to update post" });
    }
  });
  


  app.delete("/posts/:postId", async (req, res) => {
    const { postId } = req.params;
  
    try {
        
      const deletedPost = await postModel.findById(postId);
        
      if (!deletedPost) {
        return res.status(404).json({ error: "Post not found" });
      }
      if(loggedInUser._id !== deletedPost.author){
        return res.status(404).json({ error: "Cannot Delete! You are Not the Author" });
      }
      await postModel.delete(postId);
      res.status(200).json({ message: "Post deleted successfully" });
    } catch (err) {
      console.error("Failed to delete post:", err);
      res.status(500).json({ error: "Failed to delete post" });
    }
  });


  //read comments


  app.get("/posts/:postId/comments", async (req, res) => {
    const { postId } = req.params;
  
    try {
      const post = await postModel.findById(postId);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
  
      res.status(200).json(post.comments);
    } catch (err) {
      console.error("Failed to retrieve comments:", err);
      res.status(500).json({ error: "Failed to retrieve comments" });
    }
  });

  
  //add comment

  app.post("/posts/:postId/comments", async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
  
    try {
      const post = await postModel.findById(postId);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
  
      const newComment = {
        content,
        author: loggedInUser.name
      };
  
      post.comments.push(newComment);
      const savedPost = await post.save();
  
      res.status(201).json({ message: "Comment added successfully", comment: savedPost.comments[savedPost.comments.length - 1] });
    } catch (err) {
      console.error("Failed to add comment:", err);
      res.status(500).json({ error: "Failed to add comment" });
    }
  });
  
  




app.listen(3001, () => {
  console.log("Listening on port 3000");
});
