import { useEffect, useRef, useState } from "react";
import { useTheme } from "../theme";
import Layout from "../components/Layout";
import { useStore } from "../store";
import { api } from "../lib/api";
import { io, type Socket } from "socket.io-client";
import { Send, Users } from "lucide-react";

interface ChatUser {
  id: string;
  name: string;
}

interface ChatRoomMember {
  user: ChatUser;
}

interface ChatRoom {
  id: string;
  name: string;
  members: ChatRoomMember[];
}

interface ChatMessage {
  id: string;
  body: string;
  createdAt: string;
  user: ChatUser;
}

export default function ChatPage() {
  const { tokens: t } = useTheme();
  const currentUser = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    api.listChatRooms().then((data) => setRooms(data as ChatRoom[]));
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const socket = io("/", {
      transports: ["websocket"],
      auth: { userId: currentUser.id },
    });
    socketRef.current = socket;
    socket.on("new-message", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });
    return () => {
      socket.disconnect();
    };
  }, [currentUser]);

  useEffect(() => {
    if (!selectedRoom || !socketRef.current) return;
    const socket = socketRef.current;
    socket.emit("join-room", selectedRoom.id);
    api
      .listChatMessages(selectedRoom.id)
      .then((data) => setMessages(data as ChatMessage[]));
    return () => {
      socket.emit("leave-room", selectedRoom.id);
    };
  }, [selectedRoom]);

  function send() {
    if (!input.trim() || !selectedRoom || !socketRef.current) return;
    socketRef.current.emit("send-message", {
      roomId: selectedRoom.id,
      body: input.trim(),
    });
    setInput("");
  }

  async function createRoom() {
    if (!newRoomName.trim() || memberIds.length === 0) return;
    const room = (await api.createChatRoom({
      name: newRoomName,
      userIds: memberIds,
    })) as ChatRoom;
    setRooms((prev) => [...prev, room]);
    setSelectedRoom(room);
    setCreating(false);
    setNewRoomName("");
    setMemberIds([]);
  }

  return (
    <Layout>
      <div
        className="flex h-full overflow-hidden"
        style={{ backgroundColor: t.readMain }}
      >
        <div
          className="w-72 border-r flex flex-col"
          style={{ borderColor: t.divider, backgroundColor: t.readLeftBg }}
        >
          <div className="p-4 border-b" style={{ borderColor: t.divider }}>
            <button
              onClick={() => setCreating(true)}
              className="w-full py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: t.accentGrad }}
            >
              New Room
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className="w-full text-left px-4 py-3 border-b text-sm"
                style={{
                  borderColor: t.divider,
                  backgroundColor:
                    selectedRoom?.id === room.id
                      ? t.rowSelected
                      : "transparent",
                }}
              >
                <div className="font-medium" style={{ color: t.text }}>
                  {room.name}
                </div>
                <div className="text-xs" style={{ color: t.textMuted }}>
                  {room.members.length} members
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          {creating ? (
            <div className="flex-1 p-6 overflow-y-auto">
              <h2
                className="text-lg font-semibold mb-4"
                style={{ color: t.text }}
              >
                Create Room
              </h2>
              <input
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Room name"
                className="w-full mb-4 px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: t.inputBg,
                  border: `1px solid ${t.inputBorder}`,
                  color: t.text,
                }}
              />
              <div className="mb-2 text-sm" style={{ color: t.textMuted }}>
                Select members:
              </div>
              <div className="space-y-2 mb-4">
                {users
                  .filter((u) => u.id !== currentUser?.id)
                  .map((u) => (
                    <label
                      key={u.id}
                      className="flex items-center gap-2 text-sm"
                      style={{ color: t.textSub }}
                    >
                      <input
                        type="checkbox"
                        checked={memberIds.includes(u.id)}
                        onChange={(e) =>
                          setMemberIds((prev) =>
                            e.target.checked
                              ? [...prev, u.id]
                              : prev.filter((id) => id !== u.id),
                          )
                        }
                      />
                      {u.name}
                    </label>
                  ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={createRoom}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ background: t.accentGrad }}
                >
                  Create
                </button>
                <button
                  onClick={() => setCreating(false)}
                  className="px-4 py-2 rounded-lg text-sm"
                  style={{ color: t.textSub }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : selectedRoom ? (
            <>
              <div
                className="px-4 py-3 border-b flex items-center justify-between"
                style={{ borderColor: t.divider, backgroundColor: t.readTopBg }}
              >
                <span className="font-semibold" style={{ color: t.text }}>
                  {selectedRoom.name}
                </span>
                <span
                  className="text-xs flex items-center gap-1"
                  style={{ color: t.textMuted }}
                >
                  <Users className="w-3 h-3" /> {selectedRoom.members.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.user.id === currentUser?.id
                        ? "items-end"
                        : "items-start"
                    }`}
                  >
                    <div className="text-[10px]" style={{ color: t.textMuted }}>
                      {msg.user.name}
                    </div>
                    <div
                      className="max-w-[70%] px-3 py-2 rounded-xl text-sm"
                      style={{
                        backgroundColor:
                          msg.user.id === currentUser?.id
                            ? t.accent
                            : t.inputBg,
                        color:
                          msg.user.id === currentUser?.id ? "#fff" : t.text,
                      }}
                    >
                      {msg.body}
                    </div>
                  </div>
                ))}
              </div>
              <div
                className="p-3 border-t flex gap-2"
                style={{
                  borderColor: t.divider,
                  backgroundColor: t.readLeftBg,
                }}
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: t.inputBg,
                    border: `1px solid ${t.inputBorder}`,
                    color: t.text,
                  }}
                />
                <button
                  onClick={send}
                  className="p-2 rounded-lg text-white"
                  style={{ background: t.accentGrad }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div
              className="flex-1 flex items-center justify-center text-sm"
              style={{ color: t.textMuted }}
            >
              Select a room to start chatting.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
