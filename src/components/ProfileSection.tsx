import { useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import type { Area } from "react-easy-crop";
import { User, Camera, X, Save, Lock } from "lucide-react";
import { useTheme } from "../theme";
import { useStore } from "../store";
import Avatar from "./Avatar";
import { getCroppedImg } from "../lib/cropImage";

export default function ProfileSection() {
  const { tokens: t } = useTheme();
  const currentUser = useStore((s) => s.currentUser);
  const updateProfile = useStore((s) => s.updateProfile);
  const changePassword = useStore((s) => s.changePassword);

  const [form, setForm] = useState({
    name: "",
    email: "",
    timezone: "UTC",
  });
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [pwMessage, setPwMessage] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  useEffect(() => {
    if (currentUser) {
      setForm({
        name: currentUser.name || "",
        email: currentUser.email || "",
        timezone: currentUser.timezone || "UTC",
      });
      setAvatar(currentUser.avatar);
    }
  }, [currentUser]);

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      await updateProfile({ ...form, avatar });
      setMessage("Profile saved.");
    } catch (err: any) {
      setMessage(err.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePassword() {
    setPwMessage("");
    if (password.new !== password.confirm) {
      setPwMessage("New passwords do not match.");
      return;
    }
    if (password.new.length < 6) {
      setPwMessage("Password must be at least 6 characters.");
      return;
    }
    setPwSaving(true);
    const ok = await changePassword(password.current, password.new);
    setPwSaving(false);
    if (ok) {
      setPassword({ current: "", new: "", confirm: "" });
      setPwMessage("Password updated.");
    } else {
      setPwMessage("Current password is incorrect.");
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCropSrc(url);
    setCropOpen(true);
  }

  async function handleCropConfirm() {
    if (!cropSrc || !croppedAreaPixels) return;
    const cropped = await getCroppedImg(cropSrc, croppedAreaPixels, 256);
    if (cropped) setAvatar(cropped);
    setCropOpen(false);
    setCropSrc(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  }

  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: t.card, border: `1px solid ${t.cardBorder}` }}
    >
      <div className="flex items-center gap-2 mb-4">
        <User className="w-4 h-4" style={{ color: t.accent }} />
        <h3 className="text-sm font-semibold" style={{ color: t.text }}>
          Profile
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="flex flex-col items-center gap-3">
          <Avatar name={form.name} src={avatar} size="xl" />
          <label
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer"
            style={{ background: t.accentGrad }}
          >
            <Camera className="w-3.5 h-3.5" />
            Change photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
          <p className="text-xs text-center" style={{ color: t.textMuted }}>
            Upload and crop a square profile picture.
          </p>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Name"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              t={t}
            />
            <Input
              label="Email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              t={t}
            />
            <Input
              label="Timezone"
              value={form.timezone}
              onChange={(v) => setForm({ ...form, timezone: v })}
              t={t}
            />
          </div>

          <div className="flex items-center justify-between">
            {message && (
              <span className="text-xs" style={{ color: t.textSub }}>
                {message}
              </span>
            )}
            <div className="flex-1" />
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60"
              style={{ background: t.accentGrad }}
            >
              <Save className="w-4 h-4" />{" "}
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>

          <div className="border-t pt-4" style={{ borderColor: t.divider }}>
            <h4
              className="text-sm font-semibold mb-3"
              style={{ color: t.text }}
            >
              Change password
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
              <Input
                label="Current password"
                type="password"
                value={password.current}
                onChange={(v) => setPassword({ ...password, current: v })}
                t={t}
              />
              <Input
                label="New password"
                type="password"
                value={password.new}
                onChange={(v) => setPassword({ ...password, new: v })}
                t={t}
              />
              <Input
                label="Confirm new password"
                type="password"
                value={password.confirm}
                onChange={(v) => setPassword({ ...password, confirm: v })}
                t={t}
              />
            </div>
            <div className="flex items-center justify-between">
              {pwMessage && (
                <span className="text-xs" style={{ color: t.textSub }}>
                  {pwMessage}
                </span>
              )}
              <div className="flex-1" />
              <button
                onClick={handlePassword}
                disabled={pwSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60"
                style={{ background: t.accentGrad }}
              >
                <Lock className="w-4 h-4" />{" "}
                {pwSaving ? "Updating..." : "Update password"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {cropOpen && cropSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div
            className="w-full max-w-lg rounded-2xl p-5"
            style={{ backgroundColor: t.readLeftBg, boxShadow: t.shadow }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold" style={{ color: t.text }}>
                Crop profile photo
              </h3>
              <button
                onClick={() => setCropOpen(false)}
                className="p-1 rounded"
                style={{ color: t.textSub }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              className="relative w-full h-72 rounded-lg overflow-hidden mb-4"
              style={{ backgroundColor: t.appBg }}
            >
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                rotation={0}
                aspect={1}
                minZoom={1}
                maxZoom={3}
                cropShape="round"
                objectFit="contain"
                showGrid={false}
                zoomSpeed={1}
                zoomWithScroll
                style={{}}
                classes={{}}
                mediaProps={{}}
                cropperProps={{}}
                restrictPosition
                keyboardStep={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_area, pixelArea) =>
                  setCroppedAreaPixels(pixelArea)
                }
              />
            </div>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs" style={{ color: t.textMuted }}>
                Zoom
              </span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCropOpen(false)}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ color: t.textSub }}
              >
                Cancel
              </button>
              <button
                onClick={handleCropConfirm}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: t.accentGrad }}
              >
                Crop & save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({
  label,
  value,
  type = "text",
  onChange,
  t,
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (v: string) => void;
  t: any;
}) {
  return (
    <div>
      <label
        className="block text-xs font-medium mb-1.5"
        style={{ color: t.textMuted }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
        style={{
          backgroundColor: t.inputBg,
          border: `1px solid ${t.inputBorder}`,
          color: t.text,
        }}
      />
    </div>
  );
}
