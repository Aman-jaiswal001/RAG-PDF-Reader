import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const Register = ({ onLogin }) => {
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await register(name, email, password);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-slate-900 p-8"
      >
        <h1 className="text-3xl font-bold text-white">
          Create Account
        </h1>

        {error && (
          <div className="mt-4 text-red-400">
            {error}
          </div>
        )}

        <input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-6 w-full rounded-lg bg-slate-800 px-4 py-3 text-white"
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-4 w-full rounded-lg bg-slate-800 px-4 py-3 text-white"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-4 w-full rounded-lg bg-slate-800 px-4 py-3 text-white"
          required
          minLength={6}
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white"
        >
          {loading ? "Creating..." : "Register"}
        </button>

        <button
          type="button"
          onClick={onLogin}
          className="mt-4 w-full text-blue-400"
        >
          Already have an account? Login
        </button>
      </form>
    
  );
};

export default Register;