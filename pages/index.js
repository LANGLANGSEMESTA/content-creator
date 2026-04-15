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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setData(null); // Reset data lama agar layar tidak bingung
    setImages([]); // Reset gambar lama
    setProgress("Mempersiapkan data...");

    // Perbaikan AbortController agar tidak langsung memutus request baru
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    const newController = new AbortController();
    controllerRef.current = newController;

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
        signal: newController.signal,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memproses");

      // PERBAIKAN REGEX: Sekarang mendukung **[STORY]** atau [STORY]
      const get = (tag) => {
        const reg = new RegExp(`\\[\\*?${tag}\\*?\\]([\\s\\S]*?)(?=\\[|$)`, "i");
        const match = json.result.match(reg);
        return match ? match[1].trim() : "";
      };

      const parsedData = { 
        story: get("STORY"), 
        narasi: get("NARASI"), 
        caption: get("CAPTION") 
      };

      // Validasi jika hasil parsing kosong
      if (!parsedData.story && !json.images?.length) {
        throw new Error("Gagal membaca hasil dari AI. Silakan coba lagi.");
      }

      setData(parsedData);
      setImages(json.images || []);
      setProgress("");
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Fetch Error:", err.message);
        setErrorMsg(err.message);
      }
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

            <button type="submit" disabled={loading} style={{...btnStyle, opacity: loading ? 0.6 : 1}}>
              {loading ? "Sabar ya, lagi diproses..." : "Generate Sekarang"}
            </button>
          </form>
          {progress && <p style={{ color: "#0070f3", marginTop: 15, fontSize: 14 }}>{progress}</p>}
          {errorMsg && <p style={{ color: "red", marginTop: 15, fontSize: 14 }}>⚠️ {errorMsg}</p>}
        </section>

        <section>
          {data ? (
            <div style={{ background: "#fdfdfd", padding: 20, borderRadius: 12, border: "1px solid #eee" }}>
              <h3 style={{ marginTop: 0 }}>Script Video</h3>
              <div style={{ marginBottom: 15, whiteSpace: "pre-wrap" }}>
                <strong>Story:</strong> <p style={{ fontSize: "14px", color: "#333" }}>{data.story}</p>
              </div>
              <div style={{ marginBottom: 15, whiteSpace: "pre-wrap" }}>
                <strong>Voice Over:</strong> <p style={{ fontSize: "14px", color: "#333" }}>{data.narasi}</p>
              </div>
              <div style={{ marginBottom: 15 }}>
                <strong>Caption:</strong> <p style={{ fontSize: "14px", color: "#333" }}>{data.caption}</p>
              </div>
              
              <h3 style={{ marginTop: 30 }}>Storyboard (9:16)</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {images.map((img, i) => (
                  <div key={i} style={{ textAlign: "center", fontSize: 11, background: "#fff", padding: "5px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                    {img.url ? (
                      <img src={img.url} width="100%" style={{ borderRadius: 8 }} alt={`Scene ${i+1}`} />
                    ) : (
                      <div style={{ height: "150px", background: "#eee", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>Gagal Load</div>
                    )}
                    <p style={{ marginTop: "5px", fontWeight: "bold" }}>Scene {i+1}</p>
                    <p style={{ color: "#888" }}>{img.role}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ height: "400px", border: "2px dashed #eee", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", borderRadius: 12 }}>
              {loading ? "Menunggu respon AI..." : "Hasil akan muncul di sini"}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const inputStyle = { padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px" };
const btnStyle = { padding: "15px", borderRadius: "8px", background: "#000", color: "#fff", border: "none", fontWeight: "bold", cursor: "pointer" };