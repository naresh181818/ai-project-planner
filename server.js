// server.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const mongoose = require('mongoose');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// 1. CONNECT TO MONGODB ATLAS
if (!process.env.DATABASE_URL) {
  console.log("⚠️ WARNING: DATABASE_URL is missing from your .env file!");
} else {
  mongoose.connect(process.env.DATABASE_URL)
    .then(() => console.log("🎒 SUCCESS: Connected to MongoDB Atlas!"))
    .catch(err => console.error("❌ MongoDB connection error:", err.message));
}

// 2. INITIALIZE GEMINI AI
let ai;
if (!process.env.GEMINI_API_KEY) {
  console.log("⚠️ WARNING: GEMINI_API_KEY is missing from your .env file!");
} else {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  console.log("🤖 SUCCESS: Gemini AI Engine Initialized!");
}

// 3. DEFINE THE BLUEPRINTS (SCHEMAS)
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['Todo', 'In_Progress', 'Done'], default: 'Todo' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});
const Task = mongoose.model('Task', TaskSchema);

// 4. ROUTE: REGISTER
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully in MongoDB Atlas!" });
    } catch (err) {
        res.status(500).json({ message: "Error registering user" });
    }
});

// 5. ROUTE: LOGIN
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid Email or Password" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid Email or Password" });

        const token = jwt.sign({ id: user._id }, 'super_secret_key_123', { expiresIn: '1h' });
        res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ message: "Error logging in" });
    }
});

// 6. ROUTE: CREATE TASK
app.post('/api/tasks', async (req, res) => {
    try {
        const { title, description, userId } = req.body;
        const newTask = new Task({ title, description, userId });
        await newTask.save();
        res.status(201).json({ message: "Task created successfully!", task: newTask });
    } catch (err) {
        res.status(500).json({ message: "Error creating task" });
    }
});

// 7. ROUTE: GET USER TASKS
app.get('/api/tasks/:userId', async (req, res) => {
    try {
        const userTasks = await Task.find({ userId: req.params.userId });
        res.json(userTasks);
    } catch (err) {
        res.status(500).json({ message: "Error fetching tasks" });
    }
});

// 8. ROUTE: AI TASK SUGGESTIONS
app.post('/api/ai/suggest-tasks', async (req, res) => {
    try {
        const { projectIdea } = req.body;
        if (!ai) return res.status(500).json({ message: "AI engine not configured" });

     const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
        {
            role: 'user',
            parts: [{ text: `Break down the project idea "${projectIdea}" into exactly 3 clear development tasks. Return them as a clean numbered list.` }]
        }
    ]
});   

        res.json({ suggestions: response.text });
    } catch (err) {
        console.error("🔴 GEMINI ERROR DETAILS:", err.message, err.status, err.error);
        res.status(500).json({ message: "AI Generation failed" });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server is successfully running on port ${PORT}`));