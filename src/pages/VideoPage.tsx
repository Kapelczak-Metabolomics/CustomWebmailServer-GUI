import { useEffect, useRef, useState } from "react";
import { useTheme } from "../theme";
import Layout from "../components/Layout";
import { useStore } from "../store";
import { api } from "../lib/api";
import { io, type Socket } from "socket.io-client";
import { Video as VideoIcon, Phone, PhoneOff } from "lucide-react";

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

export default function VideoPage() {
  const { tokens: t } = useTheme();
  const currentUser = useStore((s) => s.currentUser);
  const [rooms, setRooms] = useState<VideoRoom[]>([]);
  const [roomId, setRoomId] = useState("");
  const [activeRoom, setActiveRoom] = useState<VideoRoom | null>(null);
  const [joined, setJoined] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteContainerRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    const socket = io("/", {
      transports: ["websocket"],
      auth: { userId: currentUser.id },
    });
    socketRef.current = socket;

    socket.on("user-joined", async ({ userId }: { userId: string }) => {
      if (!localStreamRef.current) return;
      const pc = createPeer(userId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("video-offer", {
        roomId: activeRoom?.id,
        offer,
        targetId: userId,
      });
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
        const pc = createPeer(senderId);
        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("video-answer", {
          roomId: activeRoom?.id,
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
        await peersRef.current[senderId]?.setRemoteDescription(answer);
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
        await peersRef.current[senderId]?.addIceCandidate(
          new RTCIceCandidate(candidate),
        );
      },
    );

    return () => {
      socket.disconnect();
      Object.values(peersRef.current).forEach((pc) => pc.close());
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [currentUser, activeRoom]);

  function createPeer(userId: string) {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    localStreamRef.current
      ?.getTracks()
      .forEach((track) => pc.addTrack(track, localStreamRef.current!));

    pc.onicecandidate = (e) => {
      if (e.candidate && socketRef.current) {
        socketRef.current.emit("ice-candidate", {
          roomId: activeRoom?.id,
          candidate: e.candidate,
          targetId: userId,
        });
      }
    };

    pc.ontrack = (e) => {
      let el = document.getElementById(
        `remote-${userId}`,
      ) as HTMLVideoElement | null;
      if (!el) {
        el = document.createElement("video");
        el.id = `remote-${userId}`;
        el.autoplay = true;
        el.playsInline = true;
        el.className = "w-48 h-36 rounded-lg bg-black object-cover";
        remoteContainerRef.current?.appendChild(el);
      }
      el.srcObject = e.streams[0];
    };

    peersRef.current[userId] = pc;
    return pc;
  }

  async function join(room: VideoRoom) {
    setActiveRoom(room);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const turn = await api.getTurnCredentials().catch(() => null);
      if (turn) {
        // TURN credentials are fetched; STUN still used. Mesh peers will be created on user-joined events.
      }

      socketRef.current?.emit("join-room", room.id);
      await api.post(`/video/rooms/${room.id}/join`, {});
      setJoined(true);
    } catch (err) {
      console.error("Failed to join video room:", err);
    }
  }

  async function createRoom() {
    if (!roomId.trim()) return;
    const room = (await api.createVideoRoom(roomId)) as VideoRoom;
    setRooms((prev) => [...prev, room]);
    join(room);
  }

  function leave() {
    socketRef.current?.emit("leave-room", activeRoom?.id);
    Object.values(peersRef.current).forEach((pc) => pc.close());
    peersRef.current = {};
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setActiveRoom(null);
    setJoined(false);
  }

  useEffect(() => {
    api.get(`/video/rooms`).catch(() => null);
  }, []);

  return (
    <Layout>
      <div
        className="flex h-full overflow-hidden"
        style={{ backgroundColor: t.readMain }}
      >
        <div
          className="w-72 border-r flex flex-col p-4"
          style={{ borderColor: t.divider, backgroundColor: t.readLeftBg }}
        >
          <div className="font-semibold mb-3" style={{ color: t.text }}>
            Video Rooms
          </div>
          <div className="flex gap-2 mb-4">
            <input
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Room name"
              className="flex-1 px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                color: t.text,
              }}
            />
            <button
              onClick={createRoom}
              className="p-2 rounded-lg text-white"
              style={{ background: t.accentGrad }}
            >
              <VideoIcon className="w-4 h-4" />
            </button>
          </div>
          {rooms.map((r) => (
            <button
              key={r.id}
              onClick={() => !joined && join(r)}
              className="w-full text-left px-3 py-2 rounded-lg mb-2 text-sm"
              style={{
                backgroundColor:
                  activeRoom?.id === r.id ? t.rowSelected : t.inputBg,
                color: t.text,
              }}
            >
              {r.name}
            </button>
          ))}
        </div>
        <div className="flex-1 flex flex-col p-4">
          {joined ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold" style={{ color: t.text }}>
                  {activeRoom?.name}
                </span>
                <button
                  onClick={leave}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-white"
                  style={{ background: "#EF4444" }}
                >
                  <PhoneOff className="w-4 h-4" /> Leave
                </button>
              </div>
              <div
                className="flex-1 rounded-xl overflow-hidden flex items-center justify-center"
                style={{ backgroundColor: "#000" }}
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-64 h-48 rounded-lg object-cover"
                />
                <div
                  ref={remoteContainerRef}
                  className="flex flex-wrap gap-2 ml-4"
                />
              </div>
            </>
          ) : (
            <div
              className="flex-1 flex flex-col items-center justify-center text-sm"
              style={{ color: t.textMuted }}
            >
              <Phone className="w-12 h-12 mb-4 opacity-50" />
              Create or select a room to start a video conference.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
