import { useState, useRef } from "react";
import ResultBox from "../components/ResultBox";

export default function Home() {
  const [form, setForm] = useState({
    product: "",
    description: "",
    target: "",
    price: "",
    style: "soft",
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [data, setData] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [cooldown, setCooldown] = useState(false);
  const [progress, setProgress] = useState("");

  const controllerRef = useRef(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran gambar maksimal 5MB.");
      return;
    }
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const parseResult = (text) => {
    const get = (start, end) => {
      const regex = new RegExp(`${start}([\\s\\S]*?)${end}`, "i");
      const match = text.match(regex);
      return match ? match[1].trim() : "";
    };
    return {
      story: get("\\[STORY\\]", "\\[IMAGE\\]"),
      image: get("\\[IMAGE\\]", "\\[VIDEO\\]"),
      video: get("\\[VIDEO\\]", "\\[NARASI\\]"),
      narration: get("\\[NARASI\\]", "\\[CAPTION\\]"),
      caption: get("\\[CAPTION\\]", "$"),
    };
  };

  const generate = async () => {
    if (loading || cooldown) return;

    if (!form.product.trim()) {
      alert("Nama produk wajib diisi!");
      return;
    }

    setLoading(true);
    setData(null);
    setImages([]);
    setErrorMsg("");
    setProgress("⏳ Membuat script TikTok...");

    // Timeout 3 menit — karena 10 gambar perlu waktu lebih lama
    const controller = new AbortController();
    controllerRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 180000);

    try {
      let base64Image = "";
      if (image) {
        const reader = new FileReader();
        base64Image = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => reject(new Error("Gagal membaca gambar."));
          reader.readAsDataURL(image);
        });
      }

      setProgress("⏳ Mengirim ke server... (10 gambar akan di-generate, estimasi 2–3 menit)");

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, image: base64Image }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${res.status}`);
      }

      setProgress("✅ Selesai! Menampilkan hasil...");

      const result = await res.json();

      if (!result.result) {
        throw new Error("Respons dari server kosong. Coba lagi.");
      }

      const parsed = parseResult(result.result);
      setData(parsed);
      setImages(result.images || []);
      setProgress("");

    } catch (err) {
      clearTimeout(timeout);
      setProgress("");
      if (err.name === "AbortError") {
        setErrorMsg("⏱️ Timeout! Request terlalu lama (>3 menit). Coba lagi.");
      } else {
        setErrorMsg("❌ Error: " + err.message);
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
      // Cooldown 8 detik — cegah spam klik
      setCooldown(true);
      setTimeout(() => setCooldown(false), 8000);
    }
  };

  const cancelGenerate = () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
  };

  return (
    <div className="container">
      <h1>🔥 AI TikTok Generator PRO</h1>
      <p style={{ color: "#888", fontSize: 13, marginTop: -8 }}>
        Generate 10 scene storytelling + script + narasi + caption untuk TikTok
      </p>

      {/* Upload Gambar */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>
          📷 Upload Foto Produk (opsional, maks 5MB):
        </label>
        <input type="file" accept="image/*" onChange={handleImage} />
        {preview && (
          <img
            src={preview}
            alt="preview"
            width="150"
            style={{ marginTop: 8, borderRadius: 8, display: "block" }}
          />
        )}
      </div>

      {/* Form Input */}
      <input
        name="product"
        placeholder="Nama Produk *"
        value={form.product}
        onChange={handleChange}
      />
      <input
        name="description"
        placeholder="Deskripsi Produk (opsional, bisa dikosongkan jika upload foto)"
        value={form.description}
        onChange={handleChange}
      />
      <input
        name="target"
        placeholder="Target Market (contoh: ibu rumah tangga, anak muda 18-25)"
        value={form.target}
        onChange={handleChange}
      />
      <input
        name="price"
        placeholder="Harga (contoh: Rp 99.000)"
        value={form.price}
        onChange={handleChange}
      />

      <select name="style" value={form.style} onChange={handleChange}>
        <option value="soft">Soft — lembut & emosional</option>
        <option value="hard">Hard Selling — langsung & agresif</option>
        <option value="story">Storytelling — cerita & relatable</option>
      </select>

      {/* Estimasi biaya */}
      <p style={{ fontSize: 12, color: "#27ae60", margin: "6px 0" }}>
        💰 Estimasi biaya per generate: ~$0.35–$0.45 (10 gambar DALL·E 3 standard)
      </p>

      {/* Tombol */}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button
          onClick={generate}
          disabled={loading || cooldown}
          style={{ opacity: loading || cooldown ? 0.6 : 1 }}
        >
          {loading
            ? "⏳ Generating..."
            : cooldown
            ? "⏸️ Tunggu sebentar..."
            : "Generate 10 Scene 🚀"}
        </button>

        {loading && (
          <button
            onClick={cancelGenerate}
            style={{ background: "#e74c3c", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", cursor: "pointer" }}
          >
            ✋ Cancel
          </button>
        )}
      </div>

      {/* Progress info */}
      {progress && (
        <p style={{ color: "#2980b9", fontSize: 13, marginTop: 8 }}>{progress}</p>
      )}
      {loading && (
        <p style={{ color: "#999", fontSize: 12 }}>
          Generate 10 gambar portrait membutuhkan waktu sekitar 2–3 menit. Jangan refresh halaman.
        </p>
      )}

      {/* Error */}
      {errorMsg && (
        <div style={{ background: "#ffe0e0", border: "1px solid #e74c3c", borderRadius: 8, padding: "10px 16px", color: "#c0392b", marginTop: 12 }}>
          {errorMsg}
        </div>
      )}

      {/* Hasil Script */}
      {data && (
        <>
          <ResultBox title="📖 Story (10 Scene)" content={data.story} />
          <ResultBox title="🖼️ Image Prompts" content={data.image} />
          <ResultBox title="🎬 Video Direction" content={data.video} />
          <ResultBox title="🎙️ Narasi" content={data.narration} />
          <ResultBox title="📝 Caption + Hashtag" content={data.caption} />
        </>
      )}

      {/* 10 Gambar dengan label scene */}
      {images.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h2>🎬 10 Scene TikTok — Siap Dijadikan Video</h2>
          <p style={{ fontSize: 13, color: "#666" }}>
            Urutkan gambar ini sesuai nomor scene, lalu import ke CapCut / VN / Canva untuk dijadikan video TikTok.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 12 }}>
            {images.map((item, i) => (
              <div
                key={i}
                style={{
                  textAlign: "center",
                  width: 160,
                  background: "#f9f9f9",
                  borderRadius: 10,
                  padding: 8,
                  border: "1px solid #eee",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "#e74c3c", marginBottom: 4 }}>
                  Scene {item.scene}
                </div>
                <div style={{ fontSize: 10, color: "#888", marginBottom: 6 }}>
                  {item.role}
                </div>

                {item.url ? (
                  <>
                    <img
                      src={item.url}
                      alt={`scene-${item.scene}`}
                      width="144"
                      style={{ borderRadius: 6, display: "block", margin: "0 auto" }}
                    />
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 12, display: "block", marginTop: 6 }}
                    >
                      ⬇️ Download
                    </a>
                  </>
                ) : (
                  <div
                    style={{
                      width: 144,
                      height: 200,
                      background: "#eee",
                      borderRadius: 6,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      color: "#aaa",
                      margin: "0 auto",
                    }}
                  >
                    Gagal generate
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
