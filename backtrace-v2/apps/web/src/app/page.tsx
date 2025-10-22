"use client";
import { useEffect, useState } from "react";
type Todo = { id: number; title: string; completed: boolean; createdAt: string };

export default function Home() {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [title, setTitle] = useState("");

    useEffect(() => {
        fetch("/api/todos")
            .then((r) => r.json())
            .then(setTodos);
    }, []);

    const add = async () => {
        if (!title.trim()) return;
        const res = await fetch("/api/todos", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ title })
        });
        if (res.ok) {
            setTitle("");
            // Refresh list after adding
            fetch("/api/todos")
                .then((r) => r.json())
                .then(setTodos);
        }
    };

    return (
        <main className="mx-auto max-w-xl p-6 space-y-4">
            <h1 className="text-2xl font-semibold">Todos</h1>
            <div className="flex gap-2">
                <input
                    className="border rounded px-3 py-2 flex-1"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                <button className="bg-black text-white px-4 py-2 rounded" onClick={add}>
                    Add
                </button>
            </div>
            <ul className="space-y-2">
                {todos.map((t) => (
                    <li key={t.id} className="border rounded px-3 py-2">
                        {t.title}
                    </li>
                ))}
            </ul>
        </main>
    );
}
