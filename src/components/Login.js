import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, ADMIN_EMAIL, ADMIN_PASSWORD } from "../firebase";
import { motion } from "framer-motion";
import { User, Users, Lock, LogIn } from "lucide-react";

function Login({ switchPage }) {
  const [activeTab, setActiveTab] = useState("student");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (loginId === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      try {
        await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
        return;
      } catch {
        setError("Admin login failed.");
        return;
      }
    }

    try {
      await signInWithEmailAndPassword(auth, loginId, password);
    } catch {
      setError("Login failed. Check your ID/Email and Password.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-10 w-full max-w-md border border-gray-100"
      >
        <div className="text-center mb-6">
          <motion.h2
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl font-bold text-gray-800 flex justify-center items-center gap-2"
          >
            <LogIn className="text-blue-600 w-7 h-7" />
            Login
          </motion.h2>
          <p className="text-gray-500 text-sm mt-1">Access your account securely</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-between mb-6 bg-gray-100 p-1 rounded-lg">
          {[
            { key: "student", label: "Student", icon: <User className="w-4 h-4" /> },
            { key: "parent", label: "Parent", icon: <Users className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1 rounded-md transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
              onClick={() => {
                setActiveTab(tab.key);
                setLoginId("");
                setPassword("");
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              {activeTab === "student"
                ? "Email / Admission Number / Admin Email"
                : "Email / Phone Number"}
            </label>
            <div className="relative">
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="Enter your ID or Email"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full p-3 pl-9 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400"
              />
            </div>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-sm font-medium text-center"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200"
          >
            Login
          </motion.button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-5">
          Don’t have an account?{" "}
          <span
            className="text-blue-600 font-semibold cursor-pointer hover:underline"
            onClick={switchPage}
          >
            Register
          </span>
        </p>
      </motion.div>
    </div>
  );
}

export default Login;
