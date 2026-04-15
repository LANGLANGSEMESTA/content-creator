import { useState, useRef } from "react";

export default function Home() {
  const [form, setForm] = useState({ product: "", description: "", target: "", price: "", style: "soft" });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [data, setData] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [progress, setProgress] = useState("");

  const controllerRef = useRef(null);

  const compressImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const scale = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
      };
    });
  };

  const parseResult = (text) => {
    const get = (tag) => {
      // Regex fleksibel mendukung **[TAG]** atau [TAG] serta variasi bahasa
      let pattern = tag;
      if (tag === "NARASI") pattern = "(NARASI|NARRATION)";
      if (tag === "STORY") pattern = "(STORY|STORYTELLING)";
      
      const regex = new RegExp(`\\[\\*?${pattern}\\*?\\]([\\s\\S]*?)(?=\\[|$)`, "i");
      const match = text.match(regex);
      return match ? match[1].trim() : "";
    };

    return {
      story: get("STORY"),
      narration: get("NARASI"),
      caption: get("CAPTION"),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setData(null);
    setImages([]);
    setProgress("Mempersiapkan data...");

    if (controllerRef.current) controllerRef.current.abort();
    const newController = new AbortController();
    controllerRef.current = newController;

    try {
      let base64Image = null;
      if (image) {
        setProgress("Mengoptimalkan foto...");
        base64Image = await compressImage(image);
      }

      setProgress("Generate 10 Gambar & Script (15-20 detik)...");
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, image: base64Image }),
        signal: newController.signal,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memproses");

      const parsed = parseResult(json.result);
      
      if (!parsed.story && json.images.length === 0) {
        throw new Error("Hasil kosong. Silakan coba lagi.");
      }

      setData(parsed);
      setImages(json.images || []);
      setProgress("");
    } catch (err) {
      if (err.name !== "AbortError") setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 20, fontFamily: "sans-serif" }}>
      <header style={{ textAlign: "center", marginBottom: 40 }}>
        <h1>TikTok Viral Generator PRO 🚀</h1>
        <p style={{ color: "#666" }}>Mode Hemat: Rp 800 / Video</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 30 }}>
        <section>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            <input placeholder="Nama Produk" onChange={e => setForm({...form, product: e.target.value})} required style={inputStyle} />
            <textarea placeholder="Deskripsi" onChange={e => setForm({...form, description: e.target.value})} style={{...inputStyle, height: 80}} />
            <input placeholder="Target Market" onChange={e => setForm({...form, target: e.target.value})} style={inputStyle} />
            <input placeholder="Harga" onChange={e => setForm({...form, price: e.target.value})} style={inputStyle} />
            <input type="file" accept="image/*" onChange={e => {
              const file = e.target.files[0];
              if (file) { setImage(file); setPreview(URL.createObjectURL(file)); }
            }} />
            {preview && <img src={preview} width="100%" style={{ borderRadius: 10, marginTop: 10 }} />}
            <button type="submit" disabled={loading} style={{...btnStyle, opacity: loading ? 0.6 : 1}}>
              {loading ? "Sabar ya..." : "Generate Sekarang"}
            </button>
          </form>
          {progress && <p style={{ color: "#0070f3", marginTop: 15 }}>{progress}</p>}
          {errorMsg && <p style={{ color: "red", marginTop: 15 }}>⚠️ {errorMsg}</p>}
        </section>

        <section>
          {data ? (
            <div style={{ background: "#fdfdfd", padding: 20, borderRadius: 12, border: "1px solid #eee" }}>
              <h3>📖 Script Video</h3>
              <p style={{ whiteSpace: "pre-wrap", fontSize: 14 }}><strong>Alur:</strong> {data.story}</p>
              <p style={{ whiteSpace: "pre-wrap", fontSize: 14 }}><strong>Voice Over:</strong> {data.narration}</p>
              <p style={{ whiteSpace: "pre-wrap", fontSize: 14 }}><strong>Caption:</strong> {data.caption}</p>
              
              <h3 style={{ marginTop: 30 }}>🎬 Storyboard (9:16)</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {images.map((img, i) => (
                  <div key={i} style={{ textAlign: "center", background: "#fff", padding: 5, borderRadius: 8, border: "1px solid #ddd" }}>
                    {img.url ? <img src={img.url} width="100%" style={{ borderRadius: 6 }} /> : <div style={{ height: 100, background: "#eee" }}>Gagal Load</div>}
                    <p style={{ fontSize: 10, margin: "5px 0" }}>Scene {img.scene}: {img.role}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ height: 400, border: "2px dashed #eee", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", borderRadius: 12 }}>
              {loading ? "Menunggu respon AI..." : "Hasil akan muncul di sini"}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const inputStyle = { padding: "12px", borderRadius: "8px", border: "1px solid #ddd" };
const btnStyle = { padding: "15px", borderRadius: "8px", background: "#000", color: "#fff", fontWeight: "bold", cursor: "pointer" };