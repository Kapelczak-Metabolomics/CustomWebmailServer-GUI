import { useEffect, useRef, useState, useCallback } from "react";
import { useTheme } from "../theme";
import Layout from "../components/Layout";
import { useStore } from "../store";
import { api } from "../lib/api";
import { getCookie } from "../lib/utils";
import { io, type Socket } from "socket.io-client";
import {
  Send,
  Users,
  User,
  Plus,
  Search,
  X,
  Check,
  CheckCheck,
  Eye,
  EyeOff,
  Trash2,
  LogOut,
} from "lucide-react";

interface ChatUser {
  id: string;
  name: string;
}

interface ChatRoomMember {
  user: ChatUser;
}

interface ChatReceipt {
  id: string;
  userId: string;
  deliveredAt: string | null;
  readAt: string | null;
  user: { id: string; name: string };
}

interface ChatRoom {
  id: string;
  name: string | null;
  direct: boolean;
  members: ChatRoomMember[];
}

interface ChatMessage {
  id: string;
  roomId: string;
  body: string;
  createdAt: string;
  user: ChatUser;
  receipts?: ChatReceipt[];
}

interface ReadReceiptSettings {
  readReceiptsEnabled: boolean;
  forceReadReceipts: boolean;
}

function formatReadTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatPage() {
  const { tokens: t } = useTheme();
  const currentUser = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);
  const deleteChatRoom = useStore((s) => s.deleteChatRoom);
  const leaveChatRoom = useStore((s) => s.leaveChatRoom);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isDirectChat, setIsDirectChat] = useState(true);
  const [receiptSettings, setReceiptSettings] = useState<ReadReceiptSettings>({
    readReceiptsEnabled: true,
    forceReadReceipts: false,
  });
  const [showSettings, setShowSettings] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const selectedRoomRef = useRef<string | null>(null);
  const readMessageIdsRef = useRef<Set<string>>(new Set());

  selectedRoomRef.current = selectedRoom?.id || null;

  // Load chat rooms and receipt settings
  useEffect(() => {
    api.listChatRooms().then((data) => setRooms(data as ChatRoom[]));
    api
      .getReadReceiptsSetting()
      .then((data) => setReceiptSettings(data as ReadReceiptSettings))
      .catch(() => {});
  }, []);

  // Connect socket once
  useEffect(() => {
    if (!currentUser) return;
    const token = localStorage.getItem("token") || getCookie("token") || "";
    const socket = io("/", {
      transports: ["websocket"],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("new-message", (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Auto-mark as delivered (handled by server, but also mark as read if we're in the room)
      if (msg.user.id !== currentUser.id && selectedRoomRef.current === msg.roomId) {
        // We're viewing this room, mark as read
        socket.emit("mark-read", {
          roomId: msg.roomId,
          messageIds: [msg.id],
        });
        readMessageIdsRef.current.add(msg.id);
      }
    });

    socket.on("message-delivered", (data: { messageId: string; deliveredAt: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId
            ? {
                ...m,
                receipts: [
                  ...(m.receipts || []),
                  {
                    id: `${m.id}-delivered`,
                    userId: "",
                    deliveredAt: data.deliveredAt,
                    readAt: null,
                    user: { id: "", name: "" },
                  },
                ],
              }
            : m,
        ),
      );
    });

    socket.on(
      "message-read",
      (data: {
        messageIds: string[];
        readAt: string;
        readBy: string;
        readByName: string;
        receiptsEnabled: boolean;
      }) => {
        setMessages((prev) =>
          prev.map((m) => {
            if (!data.messageIds.includes(m.id)) return m;
            const existingReceipts = m.receipts || [];
            const existing = existingReceipts.find(
              (r) => r.userId === data.readBy,
            );
            if (existing) {
              return {
                ...m,
                receipts: existingReceipts.map((r) =>
                  r.userId === data.readBy
                    ? { ...r, readAt: data.readAt }
                    : r,
                ),
              };
            }
            return {
              ...m,
              receipts: [
                ...existingReceipts,
                {
                  id: `${m.id}-${data.readBy}`,
                  userId: data.readBy,
                  deliveredAt: data.readAt,
                  readAt: data.readAt,
                  user: { id: data.readBy, name: data.readByName },
                },
              ],
            };
          }),
        );
      },
    );

    return () => {
      socket.disconnect();
    };
  }, [currentUser]);

  // Join room when selected
  useEffect(() => {
    if (!selectedRoom || !socketRef.current) return;
    const socket = socketRef.current;
    socket.emit("join-room", selectedRoom.id);
    api
      .listChatMessages(selectedRoom.id)
      .then((data) => {
        setMessages(data as ChatMessage[]);
        // Mark all unread messages from others as read
        const unreadIds = (data as ChatMessage[])
          .filter((m) => m.user.id !== currentUser?.id)
          .map((m) => m.id);
        if (unreadIds.length > 0) {
          socket.emit("mark-read", {
            roomId: selectedRoom.id,
            messageIds: unreadIds,
          });
          unreadIds.forEach((id) => readMessageIdsRef.current.add(id));
        }
      });
    return () => {
      socket.emit("leave-room", selectedRoom.id);
    };
  }, [selectedRoom, currentUser]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send() {
    if (!input.trim() || !selectedRoom || !socketRef.current) return;
    socketRef.current.emit("send-message", {
      roomId: selectedRoom.id,
      body: input.trim(),
    });
    setInput("");
  }

  async function startDirectChat(userId: string) {
    const existing = rooms.find(
      (r) =>
        r.direct &&
        r.members.length === 2 &&
        r.members.some((m) => m.user.id === userId),
    );
    if (existing) {
      setSelectedRoom(existing);
      setShowNewChat(false);
      return;
    }
    try {
      const room = (await api.createChatRoom({
        name: null,
        userIds: [userId],
        direct: true,
      })) as ChatRoom;
      setRooms((prev) => [...prev, room]);
      setSelectedRoom(room);
      setShowNewChat(false);
    } catch (err) {
      console.error("Failed to create DM:", err);
    }
  }

  async function createGroupChat() {
    if (!newGroupName.trim() || selectedUserIds.length === 0) return;
    try {
      const room = (await api.createChatRoom({
        name: newGroupName,
        userIds: selectedUserIds,
        direct: false,
      })) as ChatRoom;
      setRooms((prev) => [...prev, room]);
      setSelectedRoom(room);
      setShowNewChat(false);
      setNewGroupName("");
      setSelectedUserIds([]);
    } catch (err) {
      console.error("Failed to create group:", err);
    }
  }

  async function toggleReadReceipts() {
    const newEnabled = !receiptSettings.readReceiptsEnabled;
    try {
      await api.toggleReadReceipts(newEnabled);
      setReceiptSettings((prev) => ({ ...prev, readReceiptsEnabled: newEnabled }));
    } catch (err) {
      console.error("Failed to toggle read receipts:", err);
    }
  }

  async function handleDeleteRoom(room: ChatRoom) {
    const name = getRoomDisplayName(room);
    if (!window.confirm(`Delete conversation with ${name}? This cannot be undone.`)) return;
    try {
      await deleteChatRoom(room.id);
      setRooms((prev) => prev.filter((r) => r.id !== room.id));
      if (selectedRoom?.id === room.id) setSelectedRoom(null);
    } catch (err) {
      console.error("Failed to delete chat room:", err);
    }
  }

  async function handleLeaveRoom(room: ChatRoom) {
    const name = getRoomDisplayName(room);
    if (!window.confirm(`Leave "${name}"?`)) return;
    try {
      await leaveChatRoom(room.id);
      setRooms((prev) => prev.filter((r) => r.id !== room.id));
      if (selectedRoom?.id === room.id) setSelectedRoom(null);
    } catch (err) {
      console.error("Failed to leave chat room:", err);
    }
  }

  async function handleDeleteMessage(msg: ChatMessage) {
    if (!selectedRoom) return;
    if (!window.confirm("Delete this message?")) return;
    try {
      await api.deleteChatMessage(selectedRoom.id, msg.id);
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  }

  // Get receipt status for a message
  function getReceiptStatus(msg: ChatMessage): {
    delivered: boolean;
    readBy: { name: string; readAt: string }[];
    allRead: boolean;
    totalRecipients: number;
  } {
    const receipts = msg.receipts || [];
    const otherMembers = selectedRoom?.members.filter(
      (m) => m.user.id !== msg.user.id,
    ) || [];
    const totalRecipients = otherMembers.length;
    const delivered = receipts.some((r) => r.deliveredAt);
    const readBy = receipts
      .filter((r) => r.readAt)
      .map((r) => ({ name: r.user.name || "User", readAt: r.readAt! }));
    const allRead = totalRecipients > 0 && readBy.length >= totalRecipients;
    return { delivered, readBy, allRead, totalRecipients };
  }

  // Sort rooms: DMs first, then groups, alphabetically
  const sortedRooms = [...rooms].sort((a, b) => {
    if (a.direct !== b.direct) return a.direct ? -1 : 1;
    const aName = getRoomDisplayName(a) || "";
    const bName = getRoomDisplayName(b) || "";
    return aName.localeCompare(bName);
  });

  function getRoomDisplayName(room: ChatRoom): string {
    if (room.direct) {
      const otherMember = room.members.find(
        (m) => m.user.id !== currentUser?.id,
      );
      return otherMember?.user.name || "Direct chat";
    }
    return room.name || "Group chat";
  }

  function getRoomAvatar(room: ChatRoom) {
    if (room.direct) {
      const otherMember = room.members.find(
        (m) => m.user.id !== currentUser?.id,
      );
      return otherMember?.user.name?.[0] || "?";
    }
    return null;
  }

  const filteredUsers = users.filter(
    (u) =>
      u.id !== currentUser?.id &&
      u.name.toLowerCase().includes(search.toLowerCase()),
  );

  const receiptsEnabled = receiptSettings.forceReadReceipts || receiptSettings.readReceiptsEnabled;

  return (
    <Layout>
      <div
        className="flex h-full w-full overflow-hidden flex-1"
        style={{ backgroundColor: t.readMain }}
      >
        {/* Sidebar - Chat list */}
        <div
          className="w-80 border-r flex flex-col flex-shrink-0"
          style={{ borderColor: t.divider, backgroundColor: t.readLeftBg }}
        >
          <div
            className="p-4 border-b flex items-center justify-between"
            style={{ borderColor: t.divider }}
          >
            <h2
              className="font-semibold text-sm"
              style={{ color: t.text }}
            >
              Messages
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg transition-colors"
                style={{
                  color: receiptSettings.readReceiptsEnabled ? t.accent : t.textFaint,
                  backgroundColor: t.inputBg,
                }}
                title="Read receipts settings"
              >
                {receiptsEnabled ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setShowNewChat(true)}
                className="p-2 rounded-lg text-white"
                style={{ background: t.accentGrad }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sortedRooms.length === 0 ? (
              <div
                className="text-center p-6 text-xs"
                style={{ color: t.textMuted }}
              >
                No conversations yet. Click + to start chatting.
              </div>
            ) : (
              sortedRooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className="group w-full text-left px-4 py-3 border-b transition-colors hover:opacity-80 cursor-pointer"
                  style={{
                    borderColor: t.divider,
                    backgroundColor:
                      selectedRoom?.id === room.id ? t.rowSelected : "transparent",
                  }}
                >
                  <div className="flex items-center gap-3">
                    {room.direct ? (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg,${t.accent}22,${t.accent}10)`,
                          color: t.accent,
                        }}
                      >
                        {getRoomAvatar(room)}
                      </div>
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: t.inputBg,
                          color: t.textSub,
                        }}
                      >
                        <Users className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-sm font-medium truncate"
                        style={{ color: t.text }}
                      >
                        {getRoomDisplayName(room)}
                      </div>
                      <div
                        className="text-xs truncate"
                        style={{ color: t.textMuted }}
                      >
                        {room.direct
                          ? "Direct message"
                          : `${room.members.length} members`}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRoom(room);
                      }}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      style={{ color: t.textFaint }}
                      title={room.direct ? "Delete conversation" : "Delete conversation"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedRoom ? (
            <>
              {/* Chat header */}
              <div
                className="px-6 py-3 border-b flex items-center justify-between"
                style={{
                  borderColor: t.divider,
                  backgroundColor: t.readTopBg,
                }}
              >
                <div className="flex items-center gap-3">
                  {selectedRoom.direct ? (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
                      style={{
                        background: `linear-gradient(135deg,${t.accent}22,${t.accent}10)`,
                        color: t.accent,
                      }}
                    >
                      {getRoomAvatar(selectedRoom)}
                    </div>
                  ) : (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: t.inputBg,
                        color: t.textSub,
                      }}
                    >
                      <Users className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <div
                      className="font-semibold text-sm"
                      style={{ color: t.text }}
                    >
                      {getRoomDisplayName(selectedRoom)}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: t.textMuted }}
                    >
                      {selectedRoom.direct
                        ? "Direct message"
                        : `${selectedRoom.members.length} members · ${selectedRoom.members.map((m) => m.user.name).join(", ")}`}
                    </div>
                  </div>
                </div>
                {/* Receipt status indicator in header */}
                <div className="flex items-center gap-3">
                  <div
                    className="text-xs flex items-center gap-1.5"
                    style={{ color: t.textMuted }}
                  >
                    {receiptsEnabled ? (
                      <>
                        <CheckCheck className="w-3.5 h-3.5" style={{ color: t.accent }} />
                        <span>Read receipts on</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Read receipts off</span>
                      </>
                    )}
                  </div>
                  {selectedRoom.direct ? (
                    <button
                      onClick={() => handleDeleteRoom(selectedRoom)}
                      className="p-2 rounded-lg transition-colors"
                      style={{
                        color: t.textFaint,
                        backgroundColor: t.inputBg,
                      }}
                      title="Delete conversation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleLeaveRoom(selectedRoom)}
                      className="p-2 rounded-lg transition-colors"
                      style={{
                        color: t.textFaint,
                        backgroundColor: t.inputBg,
                      }}
                      title="Leave group"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div
                className="flex-1 overflow-y-auto px-6 py-4 space-y-3"
              >
                {messages.length === 0 ? (
                  <div
                    className="text-center py-8 text-sm"
                    style={{ color: t.textMuted }}
                  >
                    No messages yet. Say hello!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.user.id === currentUser?.id;
                    const receiptStatus = getReceiptStatus(msg);
                    return (
                      <div
                        key={msg.id}
                        className={`group/msg flex flex-col ${
                          isMe ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className="flex items-center gap-2 mb-1"
                        >
                          <span
                            className="text-xs font-medium"
                            style={{ color: isMe ? t.accent : t.textSub }}
                          >
                            {isMe ? "You" : msg.user.name}
                          </span>
                          <span
                            className="text-[10px]"
                            style={{ color: t.textFaint }}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isMe && (
                            <button
                              onClick={() => handleDeleteMessage(msg)}
                              className="opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 rounded"
                              style={{ color: t.textFaint }}
                              title="Delete message"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <div
                            className="max-w-[70%] px-4 py-2.5 rounded-2xl text-sm"
                            style={{
                              backgroundColor: isMe ? t.accent : t.inputBg,
                              color: isMe ? "#fff" : t.text,
                              borderBottomRightRadius: isMe ? "4px" : undefined,
                              borderBottomLeftRadius: !isMe ? "4px" : undefined,
                            }}
                          >
                            {msg.body}
                          </div>
                        </div>
                        {/* Receipt indicators for own messages */}
                        {isMe && (
                          <div
                            className="flex items-center gap-1 mt-1 text-[10px]"
                            style={{ color: t.textFaint }}
                          >
                            {receiptStatus.allRead ? (
                              <>
                                <CheckCheck
                                  className="w-3 h-3"
                                  style={{ color: t.accent }}
                                />
                                {selectedRoom?.direct ? (
                                  <span>
                                    Read {formatReadTime(receiptStatus.readBy[0]?.readAt || msg.createdAt)}
                                  </span>
                                ) : (
                                  <span>
                                    Read by all ({receiptStatus.readBy.length}/{receiptStatus.totalRecipients})
                                  </span>
                                )}
                              </>
                            ) : receiptStatus.readBy.length > 0 ? (
                              <>
                                <CheckCheck
                                  className="w-3 h-3"
                                  style={{ color: t.accent }}
                                />
                                <span>
                                  Read by {receiptStatus.readBy.map((r) => r.name).join(", ")}
                                </span>
                              </>
                            ) : receiptStatus.delivered ? (
                              <>
                                <CheckCheck className="w-3 h-3" />
                                <span>Delivered</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Sent</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div
                className="p-4 border-t flex gap-2"
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
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    backgroundColor: t.inputBg,
                    border: `1px solid ${t.inputBorder}`,
                    color: t.text,
                  }}
                />
                <button
                  onClick={send}
                  disabled={!input.trim()}
                  className="p-2.5 rounded-xl text-white disabled:opacity-50"
                  style={{ background: t.accentGrad }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div
              className="flex-1 flex flex-col items-center justify-center"
              style={{ color: t.textMuted }}
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: `${t.accent}11` }}
              >
                <Users className="w-10 h-10" style={{ color: t.accent }} />
              </div>
              <h3
                className="text-lg font-semibold mb-1"
                style={{ color: t.text }}
              >
                Team Chat
              </h3>
              <p className="text-sm">
                Select a conversation or start a new one.
              </p>
            </div>
          )}
        </div>

        {/* Read receipts settings modal */}
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
            <div
              className="w-full max-w-sm rounded-2xl overflow-hidden"
              style={{
                backgroundColor: t.card,
                border: `1px solid ${t.cardBorder}`,
                boxShadow: t.shadow,
              }}
            >
              <div
                className="flex items-center justify-between px-5 py-4 border-b"
                style={{ borderColor: t.divider }}
              >
                <h3
                  className="font-semibold text-sm"
                  style={{ color: t.text }}
                >
                  Read Receipts
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  style={{ color: t.textSub }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5">
                {receiptSettings.forceReadReceipts ? (
                  <div
                    className="text-sm p-3 rounded-lg"
                    style={{
                      backgroundColor: `${t.accent}11`,
                      color: t.textSub,
                    }}
                  >
                    <strong style={{ color: t.text }}>
                      Read receipts are enforced by an administrator.
                    </strong>
                    <br />
                    You cannot disable them.
                  </div>
                ) : (
                  <>
                    <p
                      className="text-sm mb-4"
                      style={{ color: t.textSub }}
                    >
                      When enabled, others can see when you've read their
                      messages. You'll also see read receipts for your messages.
                    </p>
                    <button
                      onClick={toggleReadReceipts}
                      className="w-full flex items-center justify-between p-3 rounded-xl"
                      style={{
                        backgroundColor: t.inputBg,
                        border: `1px solid ${t.inputBorder}`,
                      }}
                    >
                      <span
                        className="text-sm font-medium flex items-center gap-2"
                        style={{ color: t.text }}
                      >
                        {receiptSettings.readReceiptsEnabled ? (
                          <Eye className="w-4 h-4" style={{ color: t.accent }} />
                        ) : (
                          <EyeOff className="w-4 h-4" style={{ color: t.textFaint }} />
                        )}
                        Read receipts
                      </span>
                      <div
                        className="w-10 h-6 rounded-full flex items-center transition-all"
                        style={{
                          backgroundColor: receiptSettings.readReceiptsEnabled
                            ? t.accent
                            : t.divider,
                        }}
                      >
                        <div
                          className="w-4 h-4 rounded-full bg-white transition-all"
                          style={{
                            marginLeft: receiptSettings.readReceiptsEnabled
                              ? "22px"
                              : "2px",
                          }}
                        />
                      </div>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* New chat modal */}
        {showNewChat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
            <div
              className="w-full max-w-md rounded-2xl overflow-hidden"
              style={{
                backgroundColor: t.card,
                border: `1px solid ${t.cardBorder}`,
                boxShadow: t.shadow,
              }}
            >
              <div
                className="flex items-center justify-between px-5 py-4 border-b"
                style={{ borderColor: t.divider }}
              >
                <h3
                  className="font-semibold text-sm"
                  style={{ color: t.text }}
                >
                  New conversation
                </h3>
                <button
                  onClick={() => {
                    setShowNewChat(false);
                    setSelectedUserIds([]);
                    setNewGroupName("");
                    setIsDirectChat(true);
                  }}
                  style={{ color: t.textSub }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5">
                {/* Toggle: Direct vs Group */}
                <div
                  className="flex gap-2 mb-4 p-1 rounded-xl"
                  style={{ backgroundColor: t.inputBg }}
                >
                  <button
                    onClick={() => setIsDirectChat(true)}
                    className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor: isDirectChat ? t.accent : "transparent",
                      color: isDirectChat ? "#fff" : t.textSub,
                    }}
                  >
                    <User className="w-3.5 h-3.5 inline mr-1" />
                    Direct message
                  </button>
                  <button
                    onClick={() => setIsDirectChat(false)}
                    className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor: !isDirectChat ? t.accent : "transparent",
                      color: !isDirectChat ? "#fff" : t.textSub,
                    }}
                  >
                    <Users className="w-3.5 h-3.5 inline mr-1" />
                    Group chat
                  </button>
                </div>

                {/* Group name (only for groups) */}
                {!isDirectChat && (
                  <input
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Group name..."
                    className="w-full mb-3 px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{
                      backgroundColor: t.inputBg,
                      border: `1px solid ${t.inputBorder}`,
                      color: t.text,
                    }}
                  />
                )}

                {/* Search users */}
                <div className="relative mb-3">
                  <Search
                    className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: t.textFaint }}
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search team members..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none"
                    style={{
                      backgroundColor: t.inputBg,
                      border: `1px solid ${t.inputBorder}`,
                      color: t.text,
                    }}
                  />
                </div>

                {/* User list */}
                <div className="max-h-48 overflow-y-auto space-y-1 mb-4">
                  {filteredUsers.map((u) => {
                    const selected = selectedUserIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          if (isDirectChat) {
                            startDirectChat(u.id);
                          } else {
                            setSelectedUserIds((prev) =>
                              selected
                                ? prev.filter((id) => id !== u.id)
                                : [...prev, u.id],
                            );
                          }
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors text-left"
                        style={{
                          backgroundColor: selected ? `${t.accent}11` : "transparent",
                          color: t.text,
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                          style={{
                            background: `linear-gradient(135deg,${t.accent}22,${t.accent}10)`,
                            color: t.accent,
                          }}
                        >
                          {u.name[0]}
                        </div>
                        <span className="flex-1 truncate">{u.name}</span>
                        {!isDirectChat && selected && (
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                            style={{ backgroundColor: t.accent, color: "#fff" }}
                          >
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <div
                      className="text-center py-4 text-xs"
                      style={{ color: t.textMuted }}
                    >
                      No team members found.
                    </div>
                  )}
                </div>

                {/* Create group button */}
                {!isDirectChat && (
                  <button
                    onClick={createGroupChat}
                    disabled={!newGroupName.trim() || selectedUserIds.length === 0}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                    style={{ background: t.accentGrad }}
                  >
                    Create group ({selectedUserIds.length} selected)
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
