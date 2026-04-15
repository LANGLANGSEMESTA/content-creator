import { useState } from "react";

export default function Home() {
  const [product, setProduct] = useState("");
  const [data, setData] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const jalankan = async (e) => {
    e.preventDefault();
    setLoading(true); setImages([]); setStatus("🚀 Menghubungi API...");

    try {
      // STEP 1: Cek Koneksi ke Backend
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product }),
      });
      
      if (res.status === 404) throw new Error("File /api/generate.js TIDAK DITEMUKAN. Cek folder pages/api.");
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "OpenAI Menolak Request");

      setData(result);
      setStatus("✅ Teks Berhasil! Sekarang menggambar...");

      // STEP 2: Ambil Gambar
      for (let i = 0; i < (result.prompts?.length || 0); i++) {
        setStatus(`🎨 Menggambar ${i + 1}/${result.prompts.length}...`);
        const imgRes = await fetch("/api/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: result.prompts[i] }),
        });
        const imgData = await imgRes.json();
        if (imgData.url) setImages(prev => [...prev, imgData.url]);
      }
      setStatus("✨ Selesai!");
    } catch (err) {
      setStatus("❌ GAGAL DI SINI: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "50px auto", padding: 30, border: "2px solid #000", borderRadius: 20 }}>
      <h2 style={{ textAlign: "center" }}>TikTok Generator (Auto-Diagnostic)</h2>
      <form onSubmit={jalankan} style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input 
          placeholder="Masukkan Nama Produk..." 
          onChange={e => setProduct(e.target.value)} 
          style={{ flex: 1, padding: 15, borderRadius: 10, border: "1px solid #ccc" }} 
          required 
        />
        <button 
          type="submit" 
          disabled={loading} 
          style={{ padding: "0 30px", background: "#000", color: "#fff", borderRadius: 10, cursor: "pointer" }}
        >
          {loading ? "PROSES..." : "JALANKAN"}
        </button>
      </form>

      <div style={{ padding: 15, background: "#f0f0f0", borderRadius: 10, marginBottom: 20, textAlign: "center" }}>
        <strong>STATUS:</strong> <span style={{ color: status.includes("❌") ? "red" : "blue" }}>{status}</span>
      </div>

      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ background: "#fff", padding: 15, border: "1px solid #ddd" }}>
            <h4>Naskah AI:</h4>
            <p style={{ fontSize: 14 }}>{data.narasi}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {images.map((url, i) => <img key={i} src={url} width="100%" style={{ borderRadius: 10, boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }} />)}
          </div>
        </div>
      )}
    </div>
  );
}
