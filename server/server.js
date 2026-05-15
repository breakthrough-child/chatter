const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = 5000;

app.get("/", (req, res) => {
  res.send("Server is running...");
});

const users = [];

const channels = [
  "general",
  "coding",
  "random"
];

const bcrypt = require("bcrypt");

app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingUser = users.find(
      (user) => user.username === username
    );

    if (existingUser) {
      return res.status(400).json({
        message: "Username already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: Date.now(),
      username,
      displayName: username,
      password: hashedPassword,
      description: "",
      profilePic: ""
    };

    users.push(newUser);

    res.status(201).json({
      message: "User registered successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error"
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = users.find(
      (user) => user.username === username
    );

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        description: user.description,
        profilePic: user.profilePic
      }
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error"
    });
  }
});



app.put("/update-profile", (req, res) => {
  try {
    const {
      id,
      displayName,
      description,
      profilePic
    } = req.body;

    const user = users.find(
      (user) => user.id === id
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    user.displayName = displayName;
    user.description = description;
    user.profilePic = profilePic;

    res.status(200).json({
      message: "Profile updated",
      user
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error"
    });
  }
});


io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.emit("welcome", "Connected to socket server!");
  socket.emit("all_channels", channels);

socket.on("join_room", (room) => {
  socket.join(room);
  console.log(`User joined room: ${room}`);
});

socket.on("create_channel", (channelName) => {
  const channel =
    channelName.trim().toLowerCase();

  if (!channel) return;

  if (!channels.includes(channel)) {
    channels.push(channel);

    io.emit(
      "all_channels",
      channels
    );
  }
});

  socket.on("send_message", (data) => {
  io.to(data.room).emit("receive_message", data);
});

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
