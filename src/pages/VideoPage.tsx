import { useEffect, useRef, useState, useCallback } from "react";
import { useTheme } from "../theme";
import Layout from "../components/Layout";
import { useStore } from "../store";
import { api } from "../lib/api";
import { getCookie } from "../lib/utils";
import { io, type Socket } from "socket.io-client";
import {
  Video as VideoIcon,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  VideoOff,
  Video as VideoOn,
  Copy,
  Users,
  Plus,
  X,
  UserCircle,
  Trash2,
  MessageSquare,
  Circle,
  Square,
  Share2,
  Monitor,
} from "lucide-react";

interface VideoUser {
  id: string;
  name: string;
}

interface VideoRoomMember {
  user: VideoUser;
}

interface VideoRoom {
  id: string;
  name: string;
  createdBy: string;
  active: boolean;
  allowGuests: boolean;
  recordingActive: boolean;
  members: VideoRoomMember[];
}

interface RemotePeer {
  userId: string;
  userName: string;
  stream: MediaStream | null;
  audioEnabled: boolean;
  videoEnabled: boolean;
  connectionState: RTCPeerConnectionState;
}

interface ChatMsg {
  id: string;
  userId: string | null;
  guestName: string | null;
  body: string;
  createdAt: string;
}

export default function VideoPage() {
  const { tokens: t } = useTheme();
  const currentUser = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);
  const [rooms, setRooms] = useState<VideoRoom[]>([]);
  const [roomName, setRoomName] = useState("");
  const [activeRoom, setActiveRoom] = useState<VideoRoom | null>(null);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [participants, setParticipants] = useState<RemotePeer[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<VideoRoom | null>(null);
  const [toast, setToast] = useState("");
  const [screenSharing, setScreenSharing] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const activeRoomRef = useRef<string | null>(null);
  const currentUserRef = useRef<string | null>(null);
  const usersRef = useRef(users);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  usersRef.current = users;
  currentUserRef.current = currentUser?.id || null;

  // Connect socket once on mount
  useEffect(() => {
    if (!currentUser) return;
    const token = localStorage.getItem("token") || getCookie("token") || "";
    const socket = io("/", {
      transports: ["websocket"],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("user-joined", async ({ userId }: { userId: string }) => {
      if (userId === currentUserRef.current) return;
      if (!localStreamRef.current) return;
      const peerUser = usersRef.current.find((u) => u.id === userId);
      setParticipants((prev) => [
        ...prev.filter((p) => p.userId !== userId),
        {
          userId,
          userName: peerUser?.name || "Guest",
          stream: null,
          audioEnabled: true,
          videoEnabled: true,
          connectionState: "new",
        },
      ]);
      // Create offer to the new user
      const pc = await createPeer(userId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("video-offer", {
        roomId: activeRoomRef.current,
        offer,
        targetId: userId,
      });
    });

    socket.on("user-left", ({ userId }: { userId: string }) => {
      setParticipants((prev) => prev.filter((p) => p.userId !== userId));
      const pc = peersRef.current[userId];
      if (pc) {
        pc.close();
        delete peersRef.current[userId];
      }
    });

    socket.on(
      "video-offer",
      async ({
        senderId,
        offer,
      }: {
        senderId: string;
        offer: RTCSessionDescriptionInit;
      }) => {
        if (senderId === currentUserRef.current) return;
        const peerUser = usersRef.current.find((u) => u.id === senderId);
        setParticipants((prev) => [
          ...prev.filter((p) => p.userId !== senderId),
          {
            userId: senderId,
            userName: peerUser?.name || "Guest",
            stream: null,
            audioEnabled: true,
            videoEnabled: true,
            connectionState: "new",
          },
        ]);
        const pc = await createPeer(senderId);
        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("video-answer", {
          roomId: activeRoomRef.current,
          answer,
          targetId: senderId,
        });
      },
    );

    socket.on(
      "video-answer",
      async ({
        senderId,
        answer,
      }: {
        senderId: string;
        answer: RTCSessionDescriptionInit;
      }) => {
        const pc = peersRef.current[senderId];
        if (pc && pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(answer);
        }
      },
    );

    socket.on(
      "ice-candidate",
      async ({
        senderId,
        candidate,
      }: {
        senderId: string;
        candidate: RTCIceCandidateInit;
      }) => {
        const pc = peersRef.current[senderId];
        if (pc) {
          try {
            if (pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } else {
              // Buffer candidates if remote description not set yet
              (pc as any)._pendingCandidates = (pc as any)._pendingCandidates || [];
              (pc as any)._pendingCandidates.push(candidate);
            }
          } catch (e) {
            console.warn("ICE add error:", e);
          }
        }
      },
    );

    socket.on("room-deleted", ({ roomId }: { roomId: string }) => {
      if (activeRoomRef.current === roomId) {
        teardown();
        setToast("Meeting ended by host");
        setTimeout(() => setToast(""), 3000);
      }
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
    });

    // Video room chat
    socket.on("video-chat", (msg: ChatMsg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    // Recording status
    socket.on("recording-status", ({ active }: { active: boolean }) => {
      setIsRecording(active);
      if (active) {
        setToast("Recording started");
      } else {
        setToast("Recording stopped");
      }
      setTimeout(() => setToast(""), 3000);
    });

    return () => {
      socket.disconnect();
      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Fetch TURN credentials
  const fetchIceServers = useCallback(async (): Promise<RTCIceServer[]> => {
    const iceServers: RTCIceServer[] = [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ];
    try {
      const turnConfig = await fetch("/api/video/turn", {
        headers: {
          ...(localStorage.getItem("token")
            ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
            : {}),
        },
      }).then((r) => r.json());
      if (turnConfig.urls && turnConfig.username && turnConfig.credential) {
        iceServers.push({
          urls: turnConfig.urls,
          username: turnConfig.username,
          credential: turnConfig.credential,
        });
      }
    } catch (e) {
      console.warn("Failed to fetch TURN config:", e);
    }
    return iceServers;
  }, []);

  const createPeer = useCallback(
    async (userId: string) => {
      const iceServers = await fetchIceServers();
      const pc = new RTCPeerConnection({ iceServers });

      // Add local tracks
      const stream = localStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      }

      pc.onicecandidate = (e) => {
        if (e.candidate && socketRef.current) {
          socketRef.current.emit("ice-candidate", {
            roomId: activeRoomRef.current,
            candidate: e.candidate,
            targetId: userId,
          });
        }
      };

      pc.ontrack = (e) => {
        setParticipants((prev) => {
          const existing = prev.find((p) => p.userId === userId);
          if (existing) {
            return prev.map((p) =>
              p.userId === userId
                ? { ...p, stream: e.streams[0] }
                : p,
            );
          }
          const peerUser = usersRef.current.find((u) => u.id === userId);
          return [
            ...prev,
            {
              userId,
              userName: peerUser?.name || "Guest",
              stream: e.streams[0],
              audioEnabled: true,
              videoEnabled: true,
              connectionState: "connected",
            },
          ];
        });
      };

      pc.onconnectionstatechange = () => {
        setParticipants((prev) =>
          prev.map((p) =>
            p.userId === userId
              ? { ...p, connectionState: pc.connectionState }
              : p,
          ),
        );
        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          const pc2 = peersRef.current[userId];
          if (pc2) {
            pc2.close();
            delete peersRef.current[userId];
          }
        }
      };

      peersRef.current[userId] = pc;
      return pc;
    },
    [fetchIceServers],
  );

  function teardown() {
    Object.values(peersRef.current).forEach((pc) => pc.close());
    peersRef.current = {};
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    activeRoomRef.current = null;
    setActiveRoom(null);
    setJoined(false);
    setParticipants([]);
    setIsRecording(false);
    setScreenSharing(false);
    stopRecording();
  }

  async function joinRoom(room: VideoRoom) {
    setLoading(true);
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      localStreamRef.current = stream;

      activeRoomRef.current = room.id;
      setActiveRoom(room);
      setJoined(true);
      setMicOn(true);
      setCamOn(true);
      setIsRecording(room.recordingActive || false);

      // Join the socket room and register with the backend
      socketRef.current?.emit("join-room", room.id);
      await api.joinVideoRoom(room.id);

      // Load existing chat messages
      try {
        const msgs = await api.getVideoRoomMessages(room.id);
        setChatMessages((msgs as ChatMsg[]) || []);
      } catch {
        setChatMessages([]);
      }

      // Set srcObject AFTER the video element is rendered
      // Use requestAnimationFrame to wait for DOM update
      requestAnimationFrame(() => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          localVideoRef.current.play().catch((e) => {
            console.warn("Autoplay prevented:", e);
          });
        }
      });
    } catch (err: any) {
      console.error("Failed to join:", err);
      setError(
        err?.name === "NotAllowedError"
          ? "Camera/microphone access denied. Please allow permissions and try again."
          : err?.name === "NotFoundError"
            ? "No camera or microphone found. Please connect a device and try again."
            : "Failed to join meeting: " + (err?.message || "Unknown error"),
      );
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      activeRoomRef.current = null;
      setActiveRoom(null);
      setJoined(false);
    } finally {
      setLoading(false);
    }
  }

  async function createRoom() {
    if (!roomName.trim()) return;
    setLoading(true);
    try {
      const room = (await api.createVideoRoom(roomName)) as VideoRoom;
      if (room && !room.members) room.members = [];
      setRooms((prev) => [room, ...prev]);
      setRoomName("");
      await joinRoom(room);
    } catch (err) {
      setError("Failed to create meeting");
    } finally {
      setLoading(false);
    }
  }

  function leaveRoom() {
    const roomId = activeRoomRef.current;
    socketRef.current?.emit("leave-room", roomId);
    if (roomId) api.leaveVideoRoom(roomId).catch(() => {});
    teardown();
  }

  async function deleteRoom(room: VideoRoom) {
    try {
      await api.deleteVideoRoom(room.id);
      if (activeRoomRef.current === room.id) teardown();
      setRooms((prev) => prev.filter((r) => r.id !== room.id));
      setToast("Meeting deleted");
      setTimeout(() => setToast(""), 3000);
    } catch (err: any) {
      setError("Failed to delete meeting: " + (err?.message || "Unknown error"));
    }
    setDeleteConfirm(null);
  }

  function toggleMic() {
    const stream = localStreamRef.current;
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicOn(audioTrack.enabled);
    }
  }

  function toggleCam() {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCamOn(videoTrack.enabled);
    }
  }

  async function toggleScreenShare() {
    if (screenSharing) {
      // Stop screen share, restore camera
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
      const stream = localStreamRef.current;
      if (stream && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      // Update peers to use camera track again
      const videoTrack = stream?.getVideoTracks()[0];
      if (videoTrack) {
        Object.values(peersRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) sender.replaceTrack(videoTrack);
        });
      }
      setScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        screenStreamRef.current = screenStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        // Update peers to use screen track
        const screenTrack = screenStream.getVideoTracks()[0];
        if (screenTrack) {
          Object.values(peersRef.current).forEach((pc) => {
            const sender = pc.getSenders().find((s) => s.track?.kind === "video");
            if (sender) sender.replaceTrack(screenTrack);
          });
        }
        // When user stops sharing via browser UI
        screenTrack.onended = () => {
          setScreenSharing(false);
          screenStreamRef.current = null;
          const stream = localStreamRef.current;
          if (stream && localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          const videoTrack = stream?.getVideoTracks()[0];
          if (videoTrack) {
            Object.values(peersRef.current).forEach((pc) => {
              const sender = pc.getSenders().find((s) => s.track?.kind === "video");
              if (sender) sender.replaceTrack(videoTrack);
            });
          }
        };
        setScreenSharing(true);
      } catch (err) {
        console.error("Screen share failed:", err);
        setToast("Screen share failed");
        setTimeout(() => setToast(""), 3000);
      }
    }
  }

  function copyInvite() {
    if (!activeRoom) return;
    const url = `${window.location.origin}/video?room=${activeRoom.id}`;
    navigator.clipboard.writeText(url);
  }

  function copyGuestInvite() {
    if (!activeRoom) return;
    const url = `${window.location.origin}/video?room=${activeRoom.id}&guest=1`;
    navigator.clipboard.writeText(url);
    setToast("Guest link copied!");
    setTimeout(() => setToast(""), 3000);
  }

  // Recording
  function startRecording() {
    setRecordingError("");
    const stream = localStreamRef.current;
    if (!stream) {
      setRecordingError("No media stream to record");
      return;
    }

    // Combine local + remote streams for recording
    const combinedStream = new MediaStream();
    stream.getTracks().forEach((track) => combinedStream.addTrack(track));
    participants.forEach((p) => {
      if (p.stream) {
        p.stream.getTracks().forEach((track) => combinedStream.addTrack(track));
      }
    });

    try {
      const recorder = new MediaRecorder(combinedStream, {
        mimeType: "video/webm;codecs=vp9,opus",
      });
      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });
        // Upload the recording
        const file = new File([blob], `recording-${activeRoomRef.current}.webm`, {
          type: "video/webm",
        });
        try {
          const { url } = await api.uploadAttachment(file);
          if (activeRoomRef.current) {
            await api.toggleVideoRecording(activeRoomRef.current, false, url);
          }
          setToast("Recording saved");
          setTimeout(() => setToast(""), 3000);
        } catch (err) {
          console.error("Failed to save recording:", err);
          setRecordingError("Failed to save recording");
        }
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      // Notify via socket
      socketRef.current?.emit("recording-toggle", {
        roomId: activeRoomRef.current,
        active: true,
      });
      // Also persist via REST
      if (activeRoomRef.current) {
        api.toggleVideoRecording(activeRoomRef.current, true).catch(() => {});
      }
    } catch (err: any) {
      console.error("Recording failed:", err);
      setRecordingError("Recording not supported in this browser");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    if (isRecording) {
      socketRef.current?.emit("recording-toggle", {
        roomId: activeRoomRef.current,
        active: false,
      });
    }
    setIsRecording(false);
  }

  function toggleRecording() {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  function sendChat() {
    if (!chatInput.trim() || !activeRoomRef.current) return;
    socketRef.current?.emit("video-chat", {
      roomId: activeRoomRef.current,
      body: chatInput.trim(),
    });
    setChatInput("");
  }

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    api
      .listVideoRooms()
      .then((data: any) => setRooms((data as VideoRoom[]) || []))
      .catch(() => null);
  }, []);

  // Auto-join if room param in URL
  useEffect(() => {
    if (joined || rooms.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get("room");
    if (roomId) {
      const room = rooms.find((r) => r.id === roomId);
      if (room) joinRoom(room);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms, joined]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};
    };
  }, []);

  const allParticipants = [
    { userId: currentUser?.id || "", userName: currentUser?.name || "You", isLocal: true },
    ...participants.map((p) => ({ userId: p.userId, userName: p.userName, isLocal: false })),
  ];

  const canControlRoom =
    currentUser &&
    activeRoom &&
    (activeRoom.createdBy === currentUser.id || currentUser.role === "admin");

  return (
    <Layout>
      <div
        className="flex h-full w-full overflow-hidden flex-1"
        style={{ backgroundColor: t.readMain }}
      >
        {/* Sidebar - Room list */}
        <div
          className="w-72 border-r flex flex-col flex-shrink-0"
          style={{ borderColor: t.divider, backgroundColor: t.readLeftBg }}
        >
          <div className="p-4 border-b" style={{ borderColor: t.divider }}>
            <h2
              className="font-semibold text-sm mb-3"
              style={{ color: t.text }}
            >
              Meetings
            </h2>
            <div className="flex gap-2">
              <input
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createRoom()}
                placeholder="Meeting name..."
                className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  backgroundColor: t.inputBg,
                  border: `1px solid ${t.inputBorder}`,
                  color: t.text,
                }}
              />
              <button
                onClick={createRoom}
                disabled={loading || !roomName.trim()}
                className="p-2 rounded-lg text-white disabled:opacity-50"
                style={{ background: t.accentGrad }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {rooms.length === 0 ? (
              <div
                className="text-center p-6 text-xs"
                style={{ color: t.textMuted }}
              >
                No meetings yet. Create one to start.
              </div>
            ) : (
              rooms.map((r) => {
                const canDelete =
                  currentUser &&
                  (r.createdBy === currentUser.id ||
                    currentUser.role === "admin");
                return (
                  <div
                    key={r.id}
                    className={`w-full text-left px-4 py-3 border-b text-sm transition-colors group ${
                      joined ? "cursor-default" : "hover:opacity-80 cursor-pointer"
                    }`}
                    style={{
                      borderColor: t.divider,
                      backgroundColor:
                        activeRoom?.id === r.id ? t.rowSelected : "transparent",
                      color: t.text,
                      opacity: joined && activeRoom?.id !== r.id ? 0.5 : 1,
                    }}
                    onClick={() => !joined && joinRoom(r)}
                  >
                    <div className="font-medium flex items-center gap-2">
                      <VideoIcon className="w-3.5 h-3.5" style={{ color: t.accent }} />
                      <span className="flex-1 truncate">{r.name}</span>
                      {r.recordingActive && (
                        <Circle className="w-3 h-3 text-red-500 animate-pulse" />
                      )}
                      {canDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm(r);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                          style={{ color: "#EF4444" }}
                          title="Delete meeting"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="text-xs mt-0.5 flex items-center gap-2" style={{ color: t.textMuted }}>
                      {r.members?.length || 0} participant(s)
                      {r.allowGuests && (
                        <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${t.accent}22`, color: t.accent }}>
                          Guest link
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Main video area */}
        <div className="flex-1 flex flex-col min-w-0">
          {error && (
            <div
              className="px-4 py-3 text-sm text-center"
              style={{ backgroundColor: "#EF444422", color: "#EF4444" }}
            >
              {error}
              <button
                onClick={() => setError("")}
                className="ml-2 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {joined ? (
            <>
              {/* Meeting header */}
              <div
                className="flex items-center justify-between px-6 py-3 border-b"
                style={{
                  borderColor: t.divider,
                  backgroundColor: t.readTopBg,
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="font-semibold text-sm"
                    style={{ color: t.text }}
                  >
                    {activeRoom?.name}
                  </span>
                  <span
                    className="text-xs flex items-center gap-1"
                    style={{ color: t.textMuted }}
                  >
                    <Users className="w-3 h-3" />
                    {participants.length + 1}
                  </span>
                  {isRecording && (
                    <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "#EF444422", color: "#EF4444" }}>
                      <Circle className="w-2 h-2 animate-pulse" />
                      REC
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowChat((v) => !v)}
                    className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg"
                    style={{
                      color: showChat ? "#fff" : t.textSub,
                      backgroundColor: showChat ? t.accent : t.inputBg,
                    }}
                  >
                    <MessageSquare className="w-3 h-3" />
                    Chat
                  </button>
                  <button
                    onClick={() => setShowParticipants((v) => !v)}
                    className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg"
                    style={{
                      color: showParticipants ? "#fff" : t.textSub,
                      backgroundColor: showParticipants ? t.accent : t.inputBg,
                    }}
                  >
                    <Users className="w-3 h-3" />
                    People
                  </button>
                  <button
                    onClick={() => {
                      copyInvite();
                      setShowInvite(true);
                      setTimeout(() => setShowInvite(false), 2000);
                    }}
                    className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg"
                    style={{
                      color: t.textSub,
                      backgroundColor: t.inputBg,
                    }}
                  >
                    <Copy className="w-3 h-3" />
                    {showInvite ? "Copied!" : "Invite"}
                  </button>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Video grid */}
                <div className="flex-1 p-4 overflow-hidden">
                  <div
                    className="grid gap-3 h-full"
                    style={{
                      gridTemplateColumns: `repeat(${Math.min(participants.length + 1, 3)}, 1fr)`,
                      gridAutoRows: "1fr",
                    }}
                  >
                    {/* Local video */}
                    <div
                      className="relative rounded-xl overflow-hidden flex items-center justify-center"
                      style={{ backgroundColor: "#1a1a2e", minHeight: "150px" }}
                    >
                      <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                        style={{
                          transform: "scaleX(-1)",
                          display: camOn || screenSharing ? "block" : "none",
                        }}
                      />
                      {!camOn && !screenSharing && (
                        <div className="flex flex-col items-center justify-center">
                          <div
                            className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-2"
                            style={{
                              background: t.accentGrad,
                              color: "#fff",
                            }}
                          >
                            {currentUser?.name?.[0] || "U"}
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                        <span
                          className="text-xs px-2 py-1 rounded-md font-medium"
                          style={{
                            backgroundColor: "rgba(0,0,0,0.6)",
                            color: "#fff",
                          }}
                        >
                          {currentUser?.name} (You){screenSharing ? " — Screen" : ""}
                        </span>
                        <div className="flex gap-1">
                          {!micOn && (
                            <span
                              className="p-1 rounded-md"
                              style={{ backgroundColor: "#EF4444" }}
                            >
                              <MicOff className="w-3 h-3 text-white" />
                            </span>
                          )}
                          {!camOn && !screenSharing && (
                            <span
                              className="p-1 rounded-md"
                              style={{ backgroundColor: "#EF4444" }}
                            >
                              <VideoOff className="w-3 h-3 text-white" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Remote videos */}
                    {participants.map((p) => (
                      <div
                        key={p.userId}
                        className="relative rounded-xl overflow-hidden flex items-center justify-center"
                        style={{ backgroundColor: "#1a1a2e", minHeight: "150px" }}
                      >
                        {p.stream ? (
                          <RemoteVideo stream={p.stream} />
                        ) : (
                          <div className="flex flex-col items-center justify-center">
                            <div
                              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-2 animate-pulse"
                              style={{
                                backgroundColor: `${t.accent}44`,
                                color: t.accent,
                              }}
                            >
                              {p.userName[0]}
                            </div>
                            <span
                              className="text-xs"
                              style={{ color: t.textMuted }}
                            >
                              Connecting...
                            </span>
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                          <span
                            className="text-xs px-2 py-1 rounded-md font-medium"
                            style={{
                              backgroundColor: "rgba(0,0,0,0.6)",
                              color: "#fff",
                            }}
                          >
                            {p.userName}
                          </span>
                          {p.connectionState === "connected" && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded-full"
                              style={{
                                backgroundColor: "#22c55e88",
                                color: "#22c55e",
                              }}
                            >
                              Connected
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chat sidebar */}
                {showChat && (
                  <div
                    className="w-72 border-l flex flex-col flex-shrink-0"
                    style={{
                      borderColor: t.divider,
                      backgroundColor: t.readLeftBg,
                    }}
                  >
                    <div
                      className="flex items-center justify-between px-4 py-3 border-b"
                      style={{ borderColor: t.divider }}
                    >
                      <h3
                        className="font-semibold text-sm"
                        style={{ color: t.text }}
                      >
                        In-meeting chat
                      </h3>
                      <button
                        onClick={() => setShowChat(false)}
                        style={{ color: t.textSub }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div
                      ref={chatScrollRef}
                      className="flex-1 overflow-y-auto p-4 space-y-3"
                    >
                      {chatMessages.length === 0 ? (
                        <div
                          className="text-center text-xs py-8"
                          style={{ color: t.textMuted }}
                        >
                          No messages yet. Start the conversation!
                        </div>
                      ) : (
                        chatMessages.map((msg) => {
                          const isMe = msg.userId === currentUser?.id;
                          const name = msg.guestName || msg.userId || "User";
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                            >
                              <span
                                className="text-[10px] mb-0.5"
                                style={{ color: t.textMuted }}
                              >
                                {isMe ? "You" : name}
                              </span>
                              <div
                                className="text-sm px-3 py-2 rounded-xl max-w-[85%]"
                                style={{
                                  backgroundColor: isMe ? t.accent : t.inputBg,
                                  color: isMe ? "#fff" : t.text,
                                }}
                              >
                                {msg.body}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div
                      className="p-3 border-t flex gap-2"
                      style={{ borderColor: t.divider }}
                    >
                      <input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendChat()}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                        style={{
                          backgroundColor: t.inputBg,
                          border: `1px solid ${t.inputBorder}`,
                          color: t.text,
                        }}
                      />
                      <button
                        onClick={sendChat}
                        disabled={!chatInput.trim()}
                        className="px-3 py-2 rounded-lg text-white disabled:opacity-50"
                        style={{ background: t.accentGrad }}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Participants sidebar */}
                {showParticipants && (
                  <div
                    className="w-64 border-l flex flex-col flex-shrink-0"
                    style={{
                      borderColor: t.divider,
                      backgroundColor: t.readLeftBg,
                    }}
                  >
                    <div
                      className="flex items-center justify-between px-4 py-3 border-b"
                      style={{ borderColor: t.divider }}
                    >
                      <h3
                        className="font-semibold text-sm"
                        style={{ color: t.text }}
                      >
                        Participants ({allParticipants.length})
                      </h3>
                      <button
                        onClick={() => setShowParticipants(false)}
                        style={{ color: t.textSub }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {allParticipants.map((p) => (
                        <div
                          key={p.userId}
                          className="flex items-center gap-3 px-4 py-3 border-b"
                          style={{ borderColor: t.divider }}
                        >
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                            style={{
                              background: `linear-gradient(135deg,${t.accent}22,${t.accent}10)`,
                              color: t.accent,
                            }}
                          >
                            {p.userName[0]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div
                              className="text-sm font-medium truncate"
                              style={{ color: t.text }}
                            >
                              {p.userName}
                            </div>
                            <div
                              className="text-xs"
                              style={{ color: t.textMuted }}
                            >
                              {p.isLocal
                                ? "You"
                                : participants.find((pp) => pp.userId === p.userId)
                                    ?.connectionState === "connected"
                                  ? "Connected"
                                  : "Connecting..."}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Invite links */}
                    <div
                      className="p-4 border-t space-y-2"
                      style={{ borderColor: t.divider }}
                    >
                      <button
                        onClick={copyInvite}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
                        style={{
                          color: t.textSub,
                          backgroundColor: t.inputBg,
                        }}
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copy invite link
                      </button>
                      {activeRoom?.allowGuests && (
                        <button
                          onClick={copyGuestInvite}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
                          style={{
                            color: t.accent,
                            backgroundColor: `${t.accent}11`,
                          }}
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          Copy guest link
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Control bar */}
              <div
                className="flex items-center justify-center gap-2 px-6 py-4 border-t flex-wrap"
                style={{
                  borderColor: t.divider,
                  backgroundColor: t.readTopBg,
                }}
              >
                <button
                  onClick={toggleMic}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    backgroundColor: micOn ? t.inputBg : "#EF4444",
                    color: micOn ? t.text : "#fff",
                  }}
                >
                  {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  {micOn ? "Mute" : "Unmute"}
                </button>
                <button
                  onClick={toggleCam}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    backgroundColor: camOn ? t.inputBg : "#EF4444",
                    color: camOn ? t.text : "#fff",
                  }}
                >
                  {camOn ? <VideoOn className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  {camOn ? "Stop video" : "Start video"}
                </button>
                <button
                  onClick={toggleScreenShare}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    backgroundColor: screenSharing ? t.accent : t.inputBg,
                    color: screenSharing ? "#fff" : t.text,
                  }}
                >
                  <Monitor className="w-4 h-4" />
                  {screenSharing ? "Stop sharing" : "Share screen"}
                </button>
                {canControlRoom && (
                  <button
                    onClick={toggleRecording}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      backgroundColor: isRecording ? "#EF4444" : t.inputBg,
                      color: isRecording ? "#fff" : t.text,
                    }}
                    title={canControlRoom ? "Record meeting" : "Only host can record"}
                  >
                    {isRecording ? <Square className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                    {isRecording ? "Stop rec" : "Record"}
                  </button>
                )}
                <button
                  onClick={leaveRoom}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{ backgroundColor: "#EF4444" }}
                >
                  <PhoneOff className="w-4 h-4" />
                  Leave
                </button>
              </div>
              {recordingError && (
                <div
                  className="px-4 py-2 text-xs text-center"
                  style={{ backgroundColor: "#EF444422", color: "#EF4444" }}
                >
                  {recordingError}
                </div>
              )}
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
                <Phone className="w-10 h-10" style={{ color: t.accent }} />
              </div>
              <h3
                className="text-lg font-semibold mb-1"
                style={{ color: t.text }}
              >
                Start a meeting
              </h3>
              <p className="text-sm">
                Create a new meeting or join an existing one from the sidebar.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="rounded-xl p-6 max-w-sm w-full mx-4"
            style={{ backgroundColor: t.readTopBg, border: `1px solid ${t.divider}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-base mb-2" style={{ color: t.text }}>
              Delete meeting?
            </h3>
            <p className="text-sm mb-4" style={{ color: t.textSub }}>
              "{deleteConfirm.name}" will be permanently deleted. Active participants
              will be removed from the call.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: t.inputBg, color: t.text }}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteRoom(deleteConfirm)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: "#EF4444" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm font-medium text-white shadow-lg"
          style={{ backgroundColor: t.accent }}
        >
          {toast}
        </div>
      )}
    </Layout>
  );
}

// Separate component for remote video to properly handle stream
function RemoteVideo({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
      ref.current.play().catch(() => {});
    }
  }, [stream]);
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      className="w-full h-full object-cover"
    />
  );
}
