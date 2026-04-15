import { useState } from "react";

export default function Home() {
  const [product, setProduct] = useState("");
  const [data, setData] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const jalankan = async (e) => {
    e.preventDefault();
    setLoading(true); setImages([]); setStatus("Menyusun naskah...");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setData(result); 

      for (let i = 0; i < result.prompts.length; i++) {
        setStatus(`Menggambar ${i + 1}/5...`);
        const imgRes = await fetch("/api/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: result.prompts[i] }),
        });
        const imgData = await imgRes.json();
        if (imgData.url) setImages(prev => [...prev, imgData.url]);
      }
      setStatus("Selesai!");
    } catch (err) { setStatus("Gagal: " + err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 800, margin: "auto", padding: 20 }}>
      <h1>TikTok Tool PRO 🚀</h1>
      <form onSubmit={jalankan}>
        <input placeholder="Nama Produk" onChange={e => setProduct(e.target.value)} style={{width: '100%', padding: 10, marginBottom: 10}} />
        <button type="submit" disabled={loading} style={{width: '100%', padding: 10, background: 'black', color: 'white'}}>
          {loading ? "Proses..." : "MULAI"}
        </button>
      </form>
      <p>{status}</p>
      {data && (
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20}}>
          <div>
            <h3>Naskah:</h3>
            <p>{data.narasi}</p>
            <h3>Caption:</h3>
            <p>{data.caption}</p>
          </div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10}}>
            {images.map((url, i) => <img key={i} src={url} width="100%" style={{borderRadius: 10}} />)}
          </div>
        </div>
      )}
    </div>
  );
}
