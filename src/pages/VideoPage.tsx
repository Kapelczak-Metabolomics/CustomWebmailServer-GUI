import { useEffect, useRef, useState, useCallback } from "react";
import { useTheme } from "../theme";
import Layout from "../components/Layout";
import { useStore } from "../store";
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
  Copy,
  Users,
  Plus,
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
  members: VideoRoomMember[];
}

interface RemotePeer {
  userId: string;
  userName: string;
  stream: MediaStream | null;
  audioEnabled: boolean;
  videoEnabled: boolean;
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

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteContainerRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const activeRoomRef = useRef<string | null>(null);
  const currentUserRef = useRef<string | null>(null);
  const turnRef = useRef<{
    urls: string[];
    username: string;
    credential: string;
  } | null>(null);

  currentUserRef.current = currentUser?.id || null;

  // Connect socket once on mount
  useEffect(() => {
    if (!currentUser) return;
    const token = document.cookie.match(/token=([^;]+)/)?.[1] || "";
    const socket = io("/", {
      transports: ["websocket"],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("user-joined", async ({ userId }: { userId: string }) => {
      if (userId === currentUserRef.current) return;
      if (!localStreamRef.current) return;
      const peerUser = users.find((u) => u.id === userId);
      setParticipants((prev) => [
        ...prev.filter((p) => p.userId !== userId),
        {
          userId,
          userName: peerUser?.name || "User",
          stream: null,
          audioEnabled: true,
          videoEnabled: true,
        },
      ]);
      // Create offer to the new user
      const pc = createPeer(userId);
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
        const peerUser = users.find((u) => u.id === senderId);
        setParticipants((prev) => [
          ...prev.filter((p) => p.userId !== senderId),
          {
            userId: senderId,
            userName: peerUser?.name || "User",
            stream: null,
            audioEnabled: true,
            videoEnabled: true,
          },
        ]);
        const pc = createPeer(senderId);
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
        if (pc && pc.signalingState !== "stable") {
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
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.warn("ICE add error:", e);
          }
        }
      },
    );

    return () => {
      socket.disconnect();
      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const createPeer = useCallback((userId: string) => {
    const iceServers: RTCIceServer[] = [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ];
    if (turnRef.current) {
      turnRef.current.urls.forEach((url) => {
        iceServers.push({
          urls: url,
          username: turnRef.current!.username,
          credential: turnRef.current!.credential,
        });
      });
    }
    const pc = new RTCPeerConnection({ iceServers });

    localStreamRef.current
      ?.getTracks()
      .forEach((track) => pc.addTrack(track, localStreamRef.current!));

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
        const peerUser = users.find((u) => u.id === userId);
        return [
          ...prev,
          {
            userId,
            userName: peerUser?.name || "User",
            stream: e.streams[0],
            audioEnabled: true,
            videoEnabled: true,
          },
        ];
      });
      // Also attach to a video element
      let el = document.getElementById(
        `remote-video-${userId}`,
      ) as HTMLVideoElement | null;
      if (!el && remoteContainerRef.current) {
        el = document.createElement("video");
        el.id = `remote-video-${userId}`;
        el.autoplay = true;
        el.playsInline = true;
        el.className = "w-full h-full object-cover";
        el.setAttribute("data-user-id", userId);
        remoteContainerRef.current.appendChild(el);
      }
      if (el) el.srcObject = e.streams[0];
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        const el = document.getElementById(`remote-video-${userId}`);
        if (el) el.remove();
      }
    };

    peersRef.current[userId] = pc;
    return pc;
  }, [users]);

  async function joinRoom(room: VideoRoom) {
    setLoading(true);
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const turn = await api.getTurnCredentials().catch(() => null);
      if (turn) turnRef.current = turn;

      activeRoomRef.current = room.id;
      setActiveRoom(room);
      socketRef.current?.emit("join-room", room.id);
      await api.joinVideoRoom(room.id);
      setJoined(true);
      setMicOn(true);
      setCamOn(true);
    } catch (err: any) {
      console.error("Failed to join:", err);
      setError(
        err?.name === "NotAllowedError"
          ? "Camera/microphone access denied. Please allow permissions and try again."
          : "Failed to join room: " + (err?.message || "Unknown error"),
      );
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
      setError("Failed to create room");
    } finally {
      setLoading(false);
    }
  }

  function leaveRoom() {
    socketRef.current?.emit("leave-room", activeRoomRef.current);
    Object.values(peersRef.current).forEach((pc) => pc.close());
    peersRef.current = {};
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    activeRoomRef.current = null;
    setActiveRoom(null);
    setJoined(false);
    setParticipants([]);
    // Clean up remote video elements
    if (remoteContainerRef.current) {
      remoteContainerRef.current.innerHTML = "";
    }
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

  function copyInvite() {
    if (!activeRoom) return;
    const url = `${window.location.origin}/video?room=${activeRoom.id}`;
    navigator.clipboard.writeText(url);
  }

  useEffect(() => {
    api
      .listVideoRooms()
      .then((data: any) => setRooms((data as VideoRoom[]) || []))
      .catch(() => null);
  }, []);

  // Auto-join if room param in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get("room");
    if (roomId && rooms.length > 0 && !joined) {
      const room = rooms.find((r) => r.id === roomId);
      if (room) joinRoom(room);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms]);

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
              rooms.map((r) => (
                <button
                  key={r.id}
                  onClick={() => !joined && joinRoom(r)}
                  disabled={joined}
                  className={`w-full text-left px-4 py-3 border-b text-sm transition-colors ${
                    joined ? "cursor-default" : "hover:opacity-80"
                  }`}
                  style={{
                    borderColor: t.divider,
                    backgroundColor:
                      activeRoom?.id === r.id ? t.rowSelected : "transparent",
                    color: t.text,
                    opacity: joined && activeRoom?.id !== r.id ? 0.5 : 1,
                  }}
                >
                  <div className="font-medium flex items-center gap-2">
                    <VideoIcon className="w-3.5 h-3.5" style={{ color: t.accent }} />
                    {r.name}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: t.textMuted }}>
                    {r.members?.length || 0} participant(s)
                  </div>
                </button>
              ))
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
                </div>
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
                  {showInvite ? "Copied!" : "Invite link"}
                </button>
              </div>

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
                      style={{ display: camOn ? "block" : "none" }}
                    />
                    {!camOn && (
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
                    <div
                      className="absolute bottom-2 left-2 right-2 flex items-center justify-between"
                    >
                      <span
                        className="text-xs px-2 py-1 rounded-md font-medium"
                        style={{
                          backgroundColor: "rgba(0,0,0,0.6)",
                          color: "#fff",
                        }}
                      >
                        {currentUser?.name} (You)
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
                        {!camOn && (
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
                        <RemoteVideo
                          userId={p.userId}
                          stream={p.stream}
                          userName={p.userName}
                        />
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
                      <div className="absolute bottom-2 left-2">
                        <span
                          className="text-xs px-2 py-1 rounded-md font-medium"
                          style={{
                            backgroundColor: "rgba(0,0,0,0.6)",
                            color: "#fff",
                          }}
                        >
                          {p.userName}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Control bar */}
              <div
                className="flex items-center justify-center gap-3 px-6 py-4 border-t"
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
                  {micOn ? (
                    <Mic className="w-4 h-4" />
                  ) : (
                    <MicOff className="w-4 h-4" />
                  )}
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
                  {camOn ? (
                    <VideoOn className="w-4 h-4" />
                  ) : (
                    <VideoOff className="w-4 h-4" />
                  )}
                  {camOn ? "Stop video" : "Start video"}
                </button>
                <button
                  onClick={leaveRoom}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{ backgroundColor: "#EF4444" }}
                >
                  <PhoneOff className="w-4 h-4" />
                  Leave
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
    </Layout>
  );
}

// Separate component for remote video to properly handle stream
function RemoteVideo({
  userId,
  stream,
  userName,
}: {
  userId: string;
  stream: MediaStream;
  userName: string;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
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
