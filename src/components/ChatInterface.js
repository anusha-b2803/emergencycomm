import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { db, COLLECTIONS } from "../firebase";
import "./ChatInterface.css";

// The component now accepts 'theme' as a prop from App.js
function ChatInterface({ currentUser, theme }) {
  const [mappedUsers, setMappedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});

  // REMOVED: isDarkMode state and the problematic MutationObserver useEffect are gone.

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const isStudent = currentUser.userType === "student";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchMappedUsers = async () => {
      try {
        if (isStudent) {
          const parentId = currentUser.mappedParentId;
          if (!parentId) return;
          setMappedUsers([{ uid: parentId, name: "Your Parent" }]);
        } else {
          const q = query(
            collection(db, COLLECTIONS.USERS),
            where("mappedParentId", "==", currentUser.uid)
          );
          const snapshot = await getDocs(q);
          const users = snapshot.docs.map((doc) => ({
            uid: doc.id,
            ...doc.data(),
          }));
          setMappedUsers(users);
        }
      } catch (error) {
        console.error("Error fetching mapped users:", error);
      }
    };
    fetchMappedUsers();
  }, [isStudent, currentUser.uid, currentUser.mappedParentId]);

  useEffect(() => {
    let socket;
    const connectSocket = () => {
      socket = new WebSocket("ws://localhost:5000");
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("✅ Connected to Node bridge");
        setIsConnected(true);
      };
      socket.onclose = () => {
        console.warn("⚠️ Disconnected from Node bridge, retrying in 5s...");
        setIsConnected(false);
        setTimeout(connectSocket, 5000);
      };
      socket.onerror = (err) => console.error("WebSocket error:", err);
      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "chat") {
            setMessages((prev) => [...prev, msg]);
          } else if (msg.type === "typing") {
            setTypingUsers((prev) => ({ ...prev, [msg.from]: true }));
            setTimeout(() => {
              setTypingUsers((prev) => {
                const updated = { ...prev };
                delete updated[msg.from];
                return updated;
              });
            }, 2000);
          }
        } catch (err) {
          console.error("Invalid message format received:", event.data);
        }
      };
    };
    connectSocket();
    return () => socket?.close();
  }, []);

  useEffect(() => {
    if (!selectedUser) {
      setMessages([]);
      return;
    }
    const chatId = [currentUser.uid, selectedUser.uid].sort().join("_");
    const q = query(
      collection(db, COLLECTIONS.MESSAGES),
      where("chatId", "==", chatId),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMsgs = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      });
      setMessages(newMsgs);
    }, (error) => {
      console.error("Error fetching chat history: ", error);
      alert("Could not fetch chat history. You may be missing a Firestore index. Check the console for a link to create one.");
    });
    return () => unsubscribe();
  }, [selectedUser, currentUser.uid]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (socketRef.current?.readyState === WebSocket.OPEN && selectedUser) {
      socketRef.current.send(
        JSON.stringify({ type: "typing", from: currentUser.uid, to: selectedUser.uid })
      );
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;
    const chatId = [currentUser.uid, selectedUser.uid].sort().join("_");
    const textToSend = newMessage.trim();

    const temporaryMessage = {
      id: "temp-" + Date.now(),
      chatId,
      text: textToSend,
      senderId: currentUser.uid,
      createdAt: new Date(),
    };
    
    setMessages((prev) => [...prev, temporaryMessage]);
    setNewMessage("");
    setSending(true);

    try {
      await addDoc(collection(db, COLLECTIONS.MESSAGES), {
        chatId,
        text: textToSend,
        senderId: currentUser.uid,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please check your connection.");
      setMessages(prev => prev.filter(msg => msg.id !== temporaryMessage.id));
    } finally {
      setSending(false);
    }
  };

  let lastMessageDate = null;

  return (
    // Use the 'theme' prop directly to set the class name
    <div className={`chat-wrapper ${theme}-mode`}>
      <div className="sidebar">
        <h3>{isStudent ? "Parent" : "Students"}</h3>
        <div className="connection-status">
          <span className={`status-dot ${isConnected ? "connected" : "disconnected"}`}></span>
          {isConnected ? "Connected" : "Disconnected"}
        </div>
        <div className="user-list">
          {mappedUsers.map((user) => (
            <div
              key={user.uid}
              className={`user-item ${selectedUser?.uid === user.uid ? "active" : ""}`}
              onClick={() => setSelectedUser(user)}
            >
              <div className="avatar">{isStudent ? "👩‍👦" : "🎓"}</div>
              <div><p className="user-name">{user.name || "Unnamed User"}</p></div>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-container">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <div className="chat-avatar">{isStudent ? "👩‍👦" : "🎓"}</div>
              <div>
                <h3>{selectedUser.name || "Chat"}</h3>
                <p className={`conn-text ${isConnected ? "connected" : "disconnected"}`}>
                  {isConnected ? "Connected" : "Disconnected"}
                </p>
              </div>
            </div>
            
            <div className="chat-body">
              {messages.map((msg) => {
                const currentDate = new Date(msg.createdAt).toLocaleDateString();
                const showDateSeparator = currentDate !== lastMessageDate;
                lastMessageDate = currentDate;

                return (
                  <React.Fragment key={msg.id}>
                    {showDateSeparator && (
                      <div className="date-separator">
                        <span>
                          {new Date(msg.createdAt).toLocaleDateString(undefined, {
                            year: "numeric", month: "long", day: "numeric"
                          })}
                        </span>
                      </div>
                    )}
                    <div className={`message ${msg.senderId === currentUser.uid ? "sent" : "received"}`}>
                      <div className="bubble">
                        <p>{msg.text}</p>
                        <span className="time">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit", minute: "2-digit"
                          })}
                        </span>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              {Object.keys(typingUsers).includes(selectedUser?.uid) && (
                <div className="typing-indicator">
                  {selectedUser?.name || "User"} is typing...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="chat-input">
              <input
                value={newMessage}
                onChange={handleInputChange}
                placeholder="Type a message..."
                disabled={!isConnected || sending}
              />
              <button type="submit" disabled={!isConnected || sending || !newMessage.trim()}>
                {sending ? "..." : "➤"}
              </button>
            </form>
          </>
        ) : (
          <div className="no-chat"><p>Select a user to start chatting 💬</p></div>
        )}
      </div>
    </div>
  );
}

export default ChatInterface;