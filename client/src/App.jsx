import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_API_URL);

function App() {
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] =
  useState("");
  const [messages, setMessages] = useState([]);
  const [room, setRoom] = useState("general");
  const [channels, setChannels] =
  useState([]);
  const [newChannel, setNewChannel] =
    useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] =
  useState("");
  const [description, setDescription] =
    useState("");
  const [profilePic, setProfilePic] =
    useState("");

  useEffect(() => {
    socket.emit("join_room", "general");

    socket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("all_channels", (data) => {
      setChannels(data);
    });

    return () => {
      socket.off("receive_message");
      socket.off("all_channels");
    };
  }, []);

  const handleAuth = async (e) => {
  e.preventDefault();

  const endpoint = isLogin
    ? "login"
    : "register";

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/${endpoint}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          password
        })
      }
    );

    const data = await response.json();

    alert(data.message);

    if (endpoint === "login" && response.ok) {
      setUser({
        ...data.user
      });

      setDisplayName(data.user.displayName || "");
      setDescription(data.user.description || "");
      setProfilePic(data.user.profilePic || "");
    }

  } catch (error) {
    console.log(error);
  }
};


  const handleImageUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setProfilePic(reader.result);
    };

    reader.readAsDataURL(file);
  };


  const logout = () => {
    setUser(null);
  };


  const updateProfile = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/update-profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            id: user.id,
            displayName,
            description,
            profilePic
          })
        }
      );

      const data = await response.json();

      alert(data.message);

      setUser({
        ...data.user,
        profilePic,
        displayName,
        description
      });

    } catch (error) {
      console.log(error);
    }
  };


  const createChannel = () => {
    const trimmedChannel =
      newChannel.trim().toLowerCase();

    if (!trimmedChannel) return;

    socket.emit(
      "create_channel",
      trimmedChannel
    );

    joinRoom(trimmedChannel);

    setNewChannel("");
  };

  const joinRoom = (roomName) => {
  setRoom(roomName);
  socket.emit("join_room", roomName);
  setMessages([]);
};


  const filteredMessages = messages.filter(
    (msg) =>
      msg.text
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||

      (msg.displayName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const sendMessage = () => {
    if (message.trim() === "") return;

    const messageData = {
      room,
      text: message,
      time: new Date().toLocaleTimeString(),
      username: user.username,
      displayName,
      profilePic
    };

    socket.emit("send_message", messageData);

    setMessage("");
  };


  if (!user) {
  return (
    <div style={{ padding: "20px" }}>
      <h1>
        {isLogin ? "Login" : "Register"}
      </h1>

      <form onSubmit={handleAuth}>
        <div>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
          />
        </div>

        <br />

        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />
        </div>

        <br />

        <button type="submit">
          {isLogin ? "Login" : "Register"}
        </button>
      </form>

      <br />

      <button
        onClick={() =>
          setIsLogin(!isLogin)
        }
      >
        Switch to{" "}
        {isLogin ? "Register" : "Login"}
      </button>
    </div>
  );
}


  return (
    <div style={{ padding: "20px" }}>
      <h1>Real-Time Chat App</h1>

      <button onClick={logout}>
  Logout
</button>

<hr />

<h3>Profile</h3>

<img
  src={
    profilePic
      ? profilePic
      : "https://via.placeholder.com/100"
  }
  alt="profile"
  width="100"
  height="100"
  style={{
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid gray"
  }}
/>

<div>
  <input
    type="text"
    placeholder="Display Name"
    value={displayName}
    onChange={(e) =>
      setDisplayName(e.target.value)
    }
  />
</div>

<br />

<div>
  <input
    type="text"
    placeholder="Description"
    value={description}
    onChange={(e) =>
      setDescription(e.target.value)
    }
  />
</div>

<br />

<div>

  <div>
  <input
    type="file"
    accept="image/*"
    onChange={handleImageUpload}
  />
</div>

<br />
  <input
    type="text"
    placeholder="Profile Picture URL"
    value={profilePic}
    onChange={(e) =>
      setProfilePic(e.target.value)
    }
  />
</div>

<br />

<button onClick={updateProfile}>
  Save Profile
</button>

<hr />


      <h2>Current Room: {room}</h2>

      <div style={{ marginBottom: "10px" }}>
        <h3>Channels</h3>

        {channels.map((channel) => (
          <button
            key={channel}
            onClick={() => joinRoom(channel)}
            style={{
              marginRight: "8px",
              marginBottom: "8px"
            }}
          >
            {channel}
          </button>
        ))}

        <div style={{ marginTop: "10px" }}>
          <input
            type="text"
            placeholder="New channel"
            value={newChannel}
            onChange={(e) =>
              setNewChannel(e.target.value)
            }
          />

          <button onClick={createChannel}>
            Create
          </button>
        </div>
      </div>


      <input
        type="text"
        placeholder="Search messages..."
        value={searchTerm}
        onChange={(e) =>
          setSearchTerm(e.target.value)
        }
        style={{
          width: "100%",
          padding: "8px",
          marginBottom: "10px"
        }}
      />

      <div
        style={{
          border: "1px solid gray",
          height: "300px",
          padding: "10px",
          overflowY: "scroll",
          marginBottom: "10px"
        }}
      >
        {filteredMessages.map((msg, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              marginBottom: "15px"
            }}
          >
            <img
              src={
                msg.profilePic ||
                "https://via.placeholder.com/40"
              }
              alt="profile"
              width="40"
              height="40"
              style={{
                borderRadius: "50%",
                objectFit: "cover"
              }}
            />

            <div>
              <p style={{ margin: 0 }}>
                <strong>
                  {msg.displayName ||
                    msg.username}
                </strong>

                {" • "}

                <small>{msg.time}</small>
              </p>

              <p style={{ marginTop: "5px" }}>
                {msg.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      <input
        type="text"
        placeholder="Type message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button onClick={sendMessage}>
        Send
      </button>
    </div>
  );
}

export default App;
