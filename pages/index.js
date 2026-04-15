import { useState } from "react";

export default function Home() {
  const [product, setProduct] = useState("");
  const [data, setData] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const jalankan = async (e) => {
    e.preventDefault();
    setLoading(true); setImages([]); setStatus("🚀 Menghubungi OpenAI...");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product }),
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal di Server");

      // DI SINI KUNCINYA: Langsung pakai data, tanpa .match()
      setData(result);
      setStatus("✅ Naskah Berhasil! Sedang menggambar...");

      if (result.prompts && Array.isArray(result.prompts)) {
        for (let i = 0; i < result.prompts.length; i++) {
          setStatus(`🎨 Menggambar ${i + 1}/${result.prompts.length}...`);
          try {
            const imgRes = await fetch("/api/image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt: result.prompts[i] }),
            });
            const imgData = await imgRes.json();
            if (imgData.url) setImages(prev => [...prev, imgData.url]);
          } catch (e) { console.error("Gambar gagal"); }
        }
      }
      setStatus("✨ Selesai!");
    } catch (err) {
      setStatus("❌ ERROR: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "50px auto", padding: 30, fontFamily: "sans-serif", border: "1px solid #ddd", borderRadius: 20 }}>
      <h2 style={{ textAlign: "center" }}>TikTok Generator PRO</h2>
      <form onSubmit={jalankan} style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input 
          placeholder="Nama Produk Anda..." 
          onChange={e => setProduct(e.target.value)} 
          style={{ flex: 1, padding: 15, borderRadius: 10, border: "1px solid #ccc" }} 
          required 
        />
        <button type="submit" disabled={loading} style={{ padding: "0 30px", background: "#000", color: "#fff", borderRadius: 10 }}>
          {loading ? "PROSES..." : "JALANKAN"}
        </button>
      </form>

      <div style={{ padding: 10, background: "#f0f0f0", borderRadius: 10, marginBottom: 20, textAlign: "center" }}>
        <strong>STATUS:</strong> {status}
      </div>

      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ padding: 15, background: "#fff", border: "1px solid #eee", borderRadius: 10 }}>
            <h4>Naskah:</h4>
            <p style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{data.narasi}</p>
            <h4>Caption:</h4>
            <p style={{ fontSize: 13, color: "#666" }}>{data.caption}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {images.map((url, i) => <img key={i} src={url} width="100%" style={{ borderRadius: 10 }} />)}
          </div>
        </div>
      )}
    </div>
  );
}
