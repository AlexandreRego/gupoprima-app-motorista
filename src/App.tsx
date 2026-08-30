// =========================================================================
// PORTAL DO MOTORISTA (FRONTEND PWA) - CÓDIGO FONTE REAL DE PRODUÇÃO
// =========================================================================
// ONDE COLAR: No arquivo src/App.tsx do seu projeto React + Vite.
// O QUE ELE FAZ: Tela móvel para o motorista inserir NF, GPS, tirar e compactar fotos.

import React, { useState } from "react";

export default function App() {
  const [driver, setDriver] = useState("");
  const [plate, setPlate] = useState("");
  const [invoice, setInvoice] = useState("");
  const [status, setStatus] = useState("entregue");
  const [comments, setComments] = useState("");
  const [gps, setGps] = useState(null);
  const [base64Image, setBase64Image] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const obterGps = () => {
    if (!navigator.geolocation) {
      alert("GPS não suportado.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        alert("GPS Capturado com Sucesso!");
      },
      () => alert("Erro ao capturar GPS. Ative a localização no seu aparelho.")
    );
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        const max = 1200;
        if (w > h && w > max) { h *= max / w; w = max; }
        else if (h > max) { w *= max / h; h = max; }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        setBase64Image(canvas.toDataURL("image/jpeg", 0.7).split(",")[1]);
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  };

  const enviar = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("https://grupoprima-backend-api.onrender.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverName: driver,
          vehiclePlate: plate,
          invoice,
          status,
          comments,
          gps: gps ? `${gps.lat}, ${gps.lng}` : "Não coletado",
          imageBase64: base64Image
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg("Enviado com sucesso!");
        setInvoice("");
        setPreview(null);
        setBase64Image("");
      } else {
        setMsg("Erro: " + data.message);
      }
    } catch {
      setMsg("Erro ao conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 450, margin: "20px auto", padding: 20, fontFamily: "sans-serif", backgroundColor: "#0f172a", color: "#fff", borderRadius: 12 }}>
      <h2>Grupoprima Logística</h2>
      {msg && <p style={{ color: "#10b981" }}>{msg}</p>}
      <form onSubmit={enviar}>
        <input placeholder="Placa do Veículo" value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} required style={{ width: "100%", margin: "8px 0", padding: 8, boxSizing: "border-box" }} />
        <input placeholder="Nota Fiscal (apenas números)" type="number" value={invoice} onChange={e => setInvoice(e.target.value)} required style={{ width: "100%", margin: "8px 0", padding: 8, boxSizing: "border-box" }} />
        <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: "100%", margin: "8px 0", padding: 8, boxSizing: "border-box" }}>
          <option value="entregue">Entregue</option>
          <option value="avaria">Avaria</option>
          <option value="recusado">Recusado</option>
        </select>
        <button type="button" onClick={obterGps} style={{ width: "100%", margin: "8px 0", padding: 8 }}>📍 Capturar GPS de Auditoria</button>
        <input type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ width: "100%", margin: "8px 0" }} />
        {preview && <img src={preview} style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 8 }} />}
        <button type="submit" disabled={loading} style={{ width: "100%", background: "#10b981", color: "#fff", padding: 12, border: "none", fontWeight: "bold" }}>
          {loading ? "Enviando..." : "Enviar Ocorrência à Central 🚀"}
        </button>
      </form>
    </div>
  );
}