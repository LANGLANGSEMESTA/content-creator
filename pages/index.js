import { useState } from "react";

export default function Home() {
  const [product, setProduct] = useState("");
  const [desc, setDesc] = useState("");
  const [data, setData] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const jalankan = async (e) => {
    e.preventDefault();
    setLoading(true);
    setImages([]);
    setStatus("Menyusun naskah...");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, description: desc }),
      });
      const result = await res.json();
      setData(result); 

      const tempImgs = [];
      for (let i = 0; i < result.prompts.length; i++) {
        setStatus(`Menggambar ${i + 1} dari ${result.prompts.length}...`);
        const imgRes = await fetch("/api/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: result.prompts[i] }),
        });
        const imgData = await imgRes.json();
        if (imgData.url) {
          tempImgs.push(imgData.url);
          setImages([...tempImgs]); 
        }
      }
      setStatus("Selesai!");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 850, margin: "40px auto", padding: 20, fontFamily: 'sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: 30 }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: 5 }}>TikTok Viral Tool 🚀</h1>
        <p style={{ color: '#666' }}>Generate script dan 5 storyboard otomatis.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 30 }}>
        {/* FORM SIDE */}
        <section>
          <form onSubmit={jalankan} style={{ display: "flex", flexDirection: "column", gap: 12, background: '#f9f9f9', padding: 25, borderRadius: 15, border: '1px solid #eee' }}>
            <label style={{ fontWeight: 'bold' }}>Nama Produk</label>
            <input placeholder="Contoh: Skincare Glow Up" onChange={e => setProduct(e.target.value)} required style={inStyle} />
            
            <label style={{ fontWeight: 'bold' }}>Deskripsi Singkat</label>
            <textarea placeholder="Jelaskan keunggulan produk..." onChange={e => setDesc(e.target.value)} style={{ ...inStyle, height: 100 }} />
            
            <button type="submit" disabled={loading} style={{ ...btnStyle, background: loading ? '#ccc' : '#000' }}>
              {loading ? "Sabar, lagi proses..." : "GENERATE SEKARANG"}
            </button>
          </form>
          <p style={{ color: "#0070f3", fontWeight: "bold", textAlign: 'center', marginTop: 15 }}>{status}</p>
        </section>

        {/* RESULT SIDE */}
        <section>
          {data ? (
            <div style={{ background: "#fff", padding: 20, borderRadius: 15, border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <div style={{ marginBottom: 25 }}>
                <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: 10 }}>📖 Script & Caption</h3>
                <p><strong>Voice Over:</strong><br/><span style={{ fontSize: 14 }}>{data.narasi}</span></p>
                <p><strong>Caption:</strong><br/><span style={{ fontSize: 14 }}>{data.caption}</span></p>
              </div>

              <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: 10 }}>🎬 Storyboard (9:16)</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {images.map((url, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <img src={url} width="100%" style={{ borderRadius: 10, border: "1px solid #ddd" }} />
                    <p style={{ fontSize: 11, color: '#888', marginTop: 5 }}>Scene {i + 1}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ height: 400, border: "2px dashed #ddd", borderRadius: 15, display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
              Belum ada hasil. Masukkan produk dan klik Generate.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const inStyle = { padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px" };
const btnStyle = { padding: "15px", borderRadius: "8px", color: "#fff", fontWeight: "bold", cursor: "pointer", border: 'none' };
