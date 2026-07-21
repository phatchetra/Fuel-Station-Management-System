import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { login } from "@/lib/apiClient";

export default function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "មានបញ្ហាក្នុងការ Login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">
          អ៊ីមែល
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="input"
          placeholder="example@gmail.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">
          ពាក្យសម្ងាត់
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="input"
          placeholder="បញ្ចូលពាក្យសម្ងាត់"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <button type="submit" className="btn-primary w-full disabled:opacity-60" disabled={loading}>
        {loading ? "កំពុងចូល..." : "ចូលប្រើប្រាស់"}
      </button>
    </form>
  );
}
