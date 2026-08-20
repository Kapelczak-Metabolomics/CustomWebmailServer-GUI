import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useTheme } from "../theme";
import { api } from "../lib/api";
import { io, type Socket } from "socket.io-client";
import {
  Video as VideoIcon,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  VideoOff,
  Video as VideoOn,
  MessageSquare,
  X,
  Circle,
} from "lucide-react";

interface RoomInfo {
  id: string;
  name: string;
  allowGuests: boolean;
  active: boolean;
  recordingActive: boolean;
  _count?: { members: number };
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

export default function GuestVideoPage() {
  const { tokens: t } = useTheme();
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestId, setGuestId] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [participants, setParticipants] = useState<RemotePeer[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [toast, setToast] = useState("");

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const pendingCandidatesRef = useRef<Record<string, RTCIceCandidateInit[]>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const activeRoomRef = useRef<string | null>(null);
  const guestIdRef = useRef<string | null>(null);
  const guestNameRef = useRef<string>("");
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Get room ID from URL query param or route param
  const params = useParams();
  const roomId = params.roomId || new URLSearchParams(window.location.search).get("room") || "";

  // Fetch room info on mount
  useEffect(() => {
    if (!roomId) {
      setError("No meeting ID specified");
      return;
    }
    api
      .getVideoRoomInfo(roomId)
      .then((data: any) => {
        setRoomInfo(data as RoomInfo);
        if (!data.allowGuests) {
          setError("This meeting does not allow guest access");
        }
      })
      .catch(() => {
        setError("Meeting not found");
      });
  }, [roomId]);

  const flushPendingCandidates = useCallback((userId: string) => {
    const pending = pendingCandidatesRef.current[userId];
    if (!pending || pending.length === 0) return;
    const pc = peersRef.current[userId];
    if (!pc) return;
    for (const candidate of pending) {
      pc.addIceCandidate(new RTCIceCandidate(candidate)).catch((e) => {
        console.warn("Flushed ICE add error:", e);
      });
    }
    pendingCandidatesRef.current[userId] = [];
  }, []);

  const fetchIceServers = useCallback(async (): Promise<RTCIceServer[]> => {
    const iceServers: RTCIceServer[] = [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ];
    try {
      const turnConfig = await fetch("/api/video/turn", {
        headers: { "x-guest-id": guestIdRef.current || "guest" },
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
              p.userId === userId ? { ...p, stream: e.streams[0] } : p,
            );
          }
          return [
            ...prev,
            {
              userId,
              userName: "Participant",
              stream: e.streams[0],
              audioEnabled: true,
              videoEnabled: true,
              connectionState: "connected",
            },
          ];
        });
      };

      pc.oniceconnectionstatechange = () => {
        console.log(`[Guest WebRTC] ICE state (${userId}):`, pc.iceConnectionState);
      };

      pc.onconnectionstatechange = () => {
        console.log(`[Guest WebRTC] Connection state (${userId}):`, pc.connectionState);
        setParticipants((prev) =>
          prev.map((p) =>
            p.userId === userId
              ? { ...p, connectionState: pc.connectionState }
              : p,
          ),
        );
        if (pc.connectionState === "failed") {
          console.warn(`[Guest WebRTC] Connection failed for ${userId}, restarting ICE...`);
          pc.restartIce();
        }
        if (pc.connectionState === "closed") {
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

  async function joinAsGuest() {
    if (!guestName.trim() || !roomId) return;
    setLoading(true);
    setError("");
    try {
      // Register as guest
      const result = (await api.guestJoinVideoRoom(roomId, guestName.trim())) as any;
      const gId = result.guestId;
      setGuestId(gId);
      guestIdRef.current = gId;
      guestNameRef.current = guestName.trim();

      // Get media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      localStreamRef.current = stream;

      activeRoomRef.current = roomId;
      setJoined(true);
      setMicOn(true);
      setCamOn(true);

      // Connect socket as guest
      const socket = io("/", {
        transports: ["websocket"],
        auth: { guestId: gId, guestName: guestName.trim() },
      });
      socketRef.current = socket;

      socket.on("user-joined", async ({ userId }: { userId: string }) => {
        if (userId === gId) return;
        if (!localStreamRef.current) return;
        setParticipants((prev) => [
          ...prev.filter((p) => p.userId !== userId),
          {
            userId,
            userName: "Participant",
            stream: null,
            audioEnabled: true,
            videoEnabled: true,
            connectionState: "new",
          },
        ]);
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
        async ({ senderId, offer }: { senderId: string; offer: RTCSessionDescriptionInit }) => {
          if (senderId === gId) return;
          setParticipants((prev) => [
            ...prev.filter((p) => p.userId !== senderId),
            {
              userId: senderId,
              userName: "Participant",
              stream: null,
              audioEnabled: true,
              videoEnabled: true,
              connectionState: "new",
            },
          ]);
          const pc = await createPeer(senderId);
          await pc.setRemoteDescription(offer);
          flushPendingCandidates(senderId);
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
        async ({ senderId, answer }: { senderId: string; answer: RTCSessionDescriptionInit }) => {
          const pc = peersRef.current[senderId];
          if (pc && pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(answer);
            // Flush buffered candidates
            flushPendingCandidates(senderId);
          }
        },
      );

      socket.on(
        "ice-candidate",
        async ({ senderId, candidate }: { senderId: string; candidate: RTCIceCandidateInit }) => {
          const pc = peersRef.current[senderId];
          if (pc && pc.remoteDescription) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.warn("ICE add error:", e);
            }
          } else {
            if (!pendingCandidatesRef.current[senderId]) {
              pendingCandidatesRef.current[senderId] = [];
            }
            pendingCandidatesRef.current[senderId].push(candidate);
          }
        },
      );

      socket.on("video-chat", (msg: ChatMsg) => {
        setChatMessages((prev) => [...prev, msg]);
      });

      socket.on("recording-status", ({ active }: { active: boolean }) => {
        setIsRecording(active);
        setToast(active ? "Recording started" : "Recording stopped");
        setTimeout(() => setToast(""), 3000);
      });

      socket.on("room-deleted", () => {
        teardown();
        setError("Meeting ended by host");
      });

      // Join socket room
      socket.emit("join-room", roomId);

      // Load chat messages
      try {
        const msgs = await api.getVideoRoomMessages(roomId);
        setChatMessages((msgs as ChatMsg[]) || []);
      } catch {
        setChatMessages([]);
      }

      // Set video after render
      requestAnimationFrame(() => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          localVideoRef.current.play().catch(() => {});
        }
      });
    } catch (err: any) {
      console.error("Guest join failed:", err);
      setError(
        err?.name === "NotAllowedError"
          ? "Camera/microphone access denied. Please allow permissions and try again."
          : err?.name === "NotFoundError"
            ? "No camera or microphone found."
            : "Failed to join: " + (err?.message || "Unknown error"),
      );
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    } finally {
      setLoading(false);
    }
  }

  function teardown() {
    Object.values(peersRef.current).forEach((pc) => pc.close());
    peersRef.current = {};
    pendingCandidatesRef.current = {};
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    activeRoomRef.current = null;
    setJoined(false);
    setParticipants([]);
    setIsRecording(false);
  }

  function leaveMeeting() {
    if (activeRoomRef.current && guestIdRef.current) {
      socketRef.current?.emit("leave-room", activeRoomRef.current);
      api.guestLeaveVideoRoom(activeRoomRef.current, guestIdRef.current).catch(() => {});
    }
    socketRef.current?.disconnect();
    teardown();
    setGuestId(null);
    guestIdRef.current = null;
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

  function sendChat() {
    if (!chatInput.trim() || !activeRoomRef.current) return;
    socketRef.current?.emit("video-chat", {
      roomId: activeRoomRef.current,
      body: chatInput.trim(),
    });
    setChatInput("");
  }

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      Object.values(peersRef.current).forEach((pc) => pc.close());
      socketRef.current?.disconnect();
    };
  }, []);

  // Pre-join screen
  if (!joined) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: t.readMain }}
      >
        <div
          className="rounded-2xl p-8 max-w-md w-full"
          style={{
            backgroundColor: t.readTopBg,
            border: `1px solid ${t.divider}`,
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: t.accentGrad }}
            >
              <VideoIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: t.text }}>
                Join Meeting
              </h1>
              {roomInfo && (
                <p className="text-sm" style={{ color: t.textMuted }}>
                  {roomInfo.name}
                </p>
              )}
            </div>
          </div>

          {error ? (
            <div className="space-y-4">
              <div
                className="px-4 py-3 rounded-lg text-sm"
                style={{ backgroundColor: "#EF444422", color: "#EF4444" }}
              >
                {error}
              </div>
              <button
                onClick={() => (window.location.href = "/login")}
                className="w-full px-4 py-2.5 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: t.inputBg,
                  color: t.text,
                }}
              >
                Go to Login
              </button>
            </div>
          ) : !roomInfo ? (
            <div className="text-center py-8">
              <div className="spinner mx-auto mb-3" />
              <p className="text-sm" style={{ color: t.textMuted }}>
                Loading meeting info...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {roomInfo.recordingActive && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                  style={{ backgroundColor: "#EF444422", color: "#EF4444" }}
                >
                  <Circle className="w-3 h-3 animate-pulse" />
                  This meeting is being recorded
                </div>
              )}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: t.text }}
                >
                  Your name
                </label>
                <input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && joinAsGuest()}
                  placeholder="Enter your name to join"
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                  style={{
                    backgroundColor: t.inputBg,
                    border: `1px solid ${t.inputBorder}`,
                    color: t.text,
                  }}
                  autoFocus
                />
              </div>
              <button
                onClick={joinAsGuest}
                disabled={loading || !guestName.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: t.accentGrad }}
              >
                {loading ? (
                  <>
                    <div className="spinner" />
                    Joining...
                  </>
                ) : (
                  <>
                    <VideoIcon className="w-4 h-4" />
                    Join Meeting
                  </>
                )}
              </button>
              <p className="text-xs text-center" style={{ color: t.textMuted }}>
                You will be asked to allow camera and microphone access.
              </p>
              <div className="text-center pt-2 border-t" style={{ borderColor: t.divider }}>
                <p className="text-xs mb-2" style={{ color: t.textMuted }}>
                  Have an account?
                </p>
                <button
                  onClick={() => {
                    const redirect = encodeURIComponent(window.location.pathname + window.location.search);
                    window.location.href = `/login?redirect=${redirect}`;
                  }}
                  className="text-xs font-medium"
                  style={{ color: t.accent }}
                >
                  Sign in to join as agent
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Meeting view for guest
  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: t.readMain }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-3 border-b"
        style={{ borderColor: t.divider, backgroundColor: t.readTopBg }}
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm" style={{ color: t.text }}>
            {roomInfo?.name}
          </span>
          <span className="text-xs flex items-center gap-1" style={{ color: t.textMuted }}>
            <VideoIcon className="w-3 h-3" />
            {participants.length + 1}
          </span>
          {isRecording && (
            <span
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
              style={{ backgroundColor: "#EF444422", color: "#EF4444" }}
            >
              <Circle className="w-2 h-2 animate-pulse" />
              REC
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: t.textMuted }}>
            Guest: {guestName}
          </span>
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
                  display: camOn ? "block" : "none",
                }}
              />
              {!camOn && (
                <div className="flex flex-col items-center justify-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-2"
                    style={{ background: t.accentGrad, color: "#fff" }}
                  >
                    {guestName?.[0] || "G"}
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <span
                  className="text-xs px-2 py-1 rounded-md font-medium"
                  style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#fff" }}
                >
                  {guestName} (You)
                </span>
                <div className="flex gap-1">
                  {!micOn && (
                    <span className="p-1 rounded-md" style={{ backgroundColor: "#EF4444" }}>
                      <MicOff className="w-3 h-3 text-white" />
                    </span>
                  )}
                  {!camOn && (
                    <span className="p-1 rounded-md" style={{ backgroundColor: "#EF4444" }}>
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
                      style={{ backgroundColor: `${t.accent}44`, color: t.accent }}
                    >
                      {p.userName[0]}
                    </div>
                    <span className="text-xs" style={{ color: t.textMuted }}>
                      Connecting...
                    </span>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <span
                    className="text-xs px-2 py-1 rounded-md font-medium"
                    style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#fff" }}
                  >
                    {p.userName}
                  </span>
                  {p.connectionState === "connected" && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: "#22c55e88", color: "#22c55e" }}
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
            style={{ borderColor: t.divider, backgroundColor: t.readLeftBg }}
          >
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: t.divider }}
            >
              <h3 className="font-semibold text-sm" style={{ color: t.text }}>
                Chat
              </h3>
              <button onClick={() => setShowChat(false)} style={{ color: t.textSub }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-center text-xs py-8" style={{ color: t.textMuted }}>
                  No messages yet.
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.guestName === guestName;
                  const name = msg.guestName || "Participant";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <span className="text-[10px] mb-0.5" style={{ color: t.textMuted }}>
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
            <div className="p-3 border-t flex gap-2" style={{ borderColor: t.divider }}>
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
      </div>

      {/* Control bar */}
      <div
        className="flex items-center justify-center gap-3 px-6 py-4 border-t"
        style={{ borderColor: t.divider, backgroundColor: t.readTopBg }}
      >
        <button
          onClick={toggleMic}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
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
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
          style={{
            backgroundColor: camOn ? t.inputBg : "#EF4444",
            color: camOn ? t.text : "#fff",
          }}
        >
          {camOn ? <VideoOn className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          {camOn ? "Stop video" : "Start video"}
        </button>
        <button
          onClick={leaveMeeting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: "#EF4444" }}
        >
          <PhoneOff className="w-4 h-4" />
          Leave
        </button>
      </div>

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm font-medium text-white shadow-lg"
          style={{ backgroundColor: t.accent }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function RemoteVideo({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
      ref.current.play().catch(() => {});
    }
  }, [stream]);
  return (
    <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" />
  );
}
