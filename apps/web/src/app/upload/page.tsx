"use client";
import { useState } from "react";

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState("");

    const doUpload = async () => {
        if (!file) return;
        const fd = new FormData();
        fd.append("file", file);
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        setStatus(r.ok ? "Uploaded" : "Failed");
    };

    return (
        <main className="p-6 space-y-4">
            <input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            <button className="bg-black text-white px-4 py-2 rounded" onClick={doUpload}>Upload</button>
            <div>{status}</div>
        </main>
    );
}
