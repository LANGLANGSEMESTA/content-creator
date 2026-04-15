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

  // Kompres gambar ke Base64 agar ringan di API
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setProgress("Mempersiapkan data...");

    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();

    try {
      let base64Image = null;
      if (image) {
        setProgress("Mengoptimalkan foto produk...");
        base64Image = await compressImage(image);
      }

      setProgress("Sedang generate 10 gambar & script (15-20 detik)...");
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, image: base64Image }),
        signal: controllerRef.current.signal,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memproses");

      const get = (tag) => {
        const reg = new RegExp(`\\[${tag}\\]([\\s\\S]*?)(?=\\[|$)`, "i");
        return json.result.match(reg)?.[1]?.trim() || "";
      };

      setData({ story: get("STORY"), narasi: get("NARASI"), caption: get("CAPTION") });
      setImages(json.images);
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
        <h1 style={{ fontSize: "2rem", marginBottom: 10 }}>TikTok Viral Generator 🚀</h1>
        <p style={{ color: "#666" }}>Mode Hemat: Rp 800 / Video Plan</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 30 }}>
        {/* FORM SIDE */}
        <section>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            <input placeholder="Nama Produk" onChange={e => setForm({...form, product: e.target.value})} required style={inputStyle} />
            <textarea placeholder="Deskripsi (Opsional)" onChange={e => setForm({...form, description: e.target.value})} style={{...inputStyle, height: 80}} />
            <input placeholder="Target Audience" onChange={e => setForm({...form, target: e.target.value})} style={inputStyle} />
            <input placeholder="Harga Produk" onChange={e => setForm({...form, price: e.target.value})} style={inputStyle} />
            
            <input type="file" accept="image/*" onChange={e => {
              const file = e.target.files[0];
              if (file) { setImage(file); setPreview(URL.createObjectURL(file)); }
            }} />
            {preview && <img src={preview} width="100%" style={{ borderRadius: 10, marginTop: 10 }} />}

            <button type="submit" disabled={loading} style={btnStyle}>
              {loading ? "Sabar ya, lagi diproses..." : "Generate Sekarang"}
            </button>
          </form>
          {progress && <p style={{ color: "#0070f3", marginTop: 15, fontSize: 14 }}>{progress}</p>}
          {errorMsg && <p style={{ color: "red", marginTop: 15 }}>{errorMsg}</p>}
        </section>

        {/* RESULT SIDE */}
        <section>
          {data ? (
            <div style={{ background: "#fdfdfd", padding: 20, borderRadius: 12, border: "1px solid #eee" }}>
              <h3 style={{ marginTop: 0 }}>Script Video</h3>
              <p><strong>Story:</strong> {data.story}</p>
              <p><strong>Voice Over:</strong> {data.narasi}</p>
              <p><strong>Caption:</strong> {data.caption}</p>
              
              <h3 style={{ marginTop: 30 }}>Storyboard (9:16)</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {images.map((img, i) => (
                  <div key={i} style={{ textAlign: "center", fontSize: 11 }}>
                    {img.url ? <img src={img.url} width="100%" style={{ borderRadius: 8 }} /> : "Gagal Load"}
                    <p>{img.role}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ height: "100%", border: "2px dashed #eee", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc" }}>
              Hasil akan muncul di sini
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const inputStyle = { padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px" };
const btnStyle = { padding: "15px", borderRadius: "8px", background: "#000", color: "#fff", border: "none", fontWeight: "bold", cursor: "pointer" };