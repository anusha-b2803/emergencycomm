// src/components/Register.js
import React, { useState, memo, useMemo } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, COLLECTIONS } from "../firebase";
import { motion } from "framer-motion";
import {
  UserPlus,
  User,
  Users,
  Phone,
  Lock,
  Mail,
  KeyRound,
  Send,
  Eye,
  EyeOff,
} from "lucide-react";

const Input = memo(
  ({
    label,
    value,
    onChange,
    type = "text",
    icon = null,
    placeholder = "",
    showPassword,
    toggleShowPassword,
  }) => (
    <div className="mb-3">
      {label && (
        <label className="text-sm font-medium text-blue-700 mb-1 block">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && <span className="absolute left-3 top-3.5 text-blue-400">{icon}</span>}
        <input
          type={type === "password" && showPassword ? "text" : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          className="w-full p-3 pl-9 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-blue-300 bg-white text-blue-900"
        />
        {type === "password" && (
          <span
            className="absolute right-3 top-3.5 cursor-pointer text-blue-500"
            onClick={toggleShowPassword}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </span>
        )}
      </div>
    </div>
  )
);

function Register({ switchPage }) {
  const [activeTab, setActiveTab] = useState("student");
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Student
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [admission, setAdmission] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [studentConfirmPassword, setStudentConfirmPassword] = useState("");

  // Parent
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [parentPassword, setParentPassword] = useState("");
  const [parentConfirmPassword, setParentConfirmPassword] = useState("");

  const memoIcons = useMemo(
    () => ({
      user: <User />,
      users: <Users />,
      mail: <Mail />,
      lock: <Lock />,
      key: <KeyRound />,
      phone: <Phone />,
      send: <Send />,
    }),
    []
  );

  const handleSendOtp = () => {
    if (!phone) return alert("Enter phone number first!");
    const generatedOtp = Math.floor(100000 + Math.random() * 900000);
    localStorage.setItem("otp", generatedOtp);
    setOtpSent(true);
    alert(`OTP sent (mock): ${generatedOtp}`);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    // ✅ Validation
    const passwordsMatch =
      activeTab === "student"
        ? studentPassword === studentConfirmPassword
        : parentPassword === parentConfirmPassword;
    if (!passwordsMatch) {
      setError("Passwords do not match!");
      return;
    }

    if (activeTab === "parent" && (!otpSent || otp !== localStorage.getItem("otp"))) {
      setError("Please verify the OTP.");
      return;
    }

    try {
      const email =
        activeTab === "student" ? studentEmail.trim() : parentEmail.trim();
      const password =
        activeTab === "student" ? studentPassword : parentPassword;

      console.log("🚀 Creating auth user...");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log("✅ Auth user created:", user.uid);

      const profile =
        activeTab === "student"
          ? {
              userType: "student",
              name: studentName,
              email,
              admissionNumber: admission,
              isMapped: false,
              createdAt: new Date().toISOString(),
            }
          : {
              userType: "parent",
              name: parentName,
              email,
              phoneNumber: phone,
              mappedStudentId: null,
              createdAt: new Date().toISOString(),
            };

      console.log("📝 Saving user profile to Firestore...");
      await setDoc(doc(db, COLLECTIONS.USERS, user.uid), profile);

      console.log("🎉 Firestore document created successfully!");
      alert("Registration successful! Please log in.");
      switchPage();
    } catch (err) {
      console.error("🔥 Registration error:", err);
      setError("Error: " + err.message);
      alert("Error registering user: " + err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md border border-blue-200"
      >
        {/* === Header === */}
        <div className="text-center mb-6">
          <motion.h2
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl font-bold text-blue-900 flex justify-center items-center gap-2"
          >
            <UserPlus className="text-blue-500 w-7 h-7" /> Register
          </motion.h2>
          <p className="text-blue-700 text-sm mt-1">Create your account</p>
        </div>

        {/* === Tabs === */}
        <div className="flex justify-between mb-6 bg-blue-50 p-1 rounded-lg">
          {[
            { key: "student", label: "Student", icon: memoIcons.user },
            { key: "parent", label: "Parent", icon: memoIcons.users },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1 rounded-md transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-blue-500 text-white shadow-md"
                  : "text-blue-700 hover:bg-blue-100"
              }`}
              onClick={() => {
                setActiveTab(tab.key);
                setError("");
                setOtpSent(false);
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* === Form === */}
        <form onSubmit={handleRegister}>
          {activeTab === "student" ? (
            <>
              <Input
                label="Full Name"
                icon={memoIcons.user}
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                icon={memoIcons.mail}
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
              />
              <Input
                label="Admission Number"
                icon={memoIcons.key}
                value={admission}
                onChange={(e) => setAdmission(e.target.value)}
              />
              <Input
                label="Password"
                type="password"
                icon={memoIcons.lock}
                value={studentPassword}
                onChange={(e) => setStudentPassword(e.target.value)}
                showPassword={showPassword}
                toggleShowPassword={() => setShowPassword((prev) => !prev)}
              />
              <Input
                label="Confirm Password"
                type="password"
                icon={memoIcons.lock}
                value={studentConfirmPassword}
                onChange={(e) => setStudentConfirmPassword(e.target.value)}
                showPassword={showPassword}
                toggleShowPassword={() => setShowPassword((prev) => !prev)}
              />
            </>
          ) : (
            <>
              <Input
                label="Full Name"
                icon={memoIcons.user}
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                icon={memoIcons.mail}
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
              />
              <Input
                label="Phone Number"
                icon={memoIcons.phone}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              {!otpSent ? (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={handleSendOtp}
                  className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium shadow-sm flex items-center justify-center gap-2 mb-3"
                >
                  <Send className="w-4 h-4" /> Send OTP
                </motion.button>
              ) : (
                <Input
                  label="Enter OTP"
                  icon={memoIcons.key}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              )}
              <Input
                label="Password"
                type="password"
                icon={memoIcons.lock}
                value={parentPassword}
                onChange={(e) => setParentPassword(e.target.value)}
                showPassword={showPassword}
                toggleShowPassword={() => setShowPassword((prev) => !prev)}
              />
              <Input
                label="Confirm Password"
                type="password"
                icon={memoIcons.lock}
                value={parentConfirmPassword}
                onChange={(e) => setParentConfirmPassword(e.target.value)}
                showPassword={showPassword}
                toggleShowPassword={() => setShowPassword((prev) => !prev)}
              />
            </>
          )}

          {error && (
            <p className="text-red-500 text-sm font-medium text-center mb-2">
              {error}
            </p>
          )}

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={activeTab === "parent" && !otpSent}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition-all duration-200"
          >
            Register
          </motion.button>
        </form>

        <p className="text-center text-sm text-blue-700 mt-5">
          Already have an account?{" "}
          <span
            className="text-blue-900 font-semibold cursor-pointer hover:underline"
            onClick={switchPage}
          >
            Login
          </span>
        </p>
      </motion.div>
    </div>
  );
}

export default Register;
