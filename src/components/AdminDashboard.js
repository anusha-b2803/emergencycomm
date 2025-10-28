import React, { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db, COLLECTIONS } from "../firebase";
import UserList from "./UserList";
import { motion } from "framer-motion";
import { UserCog, Users, Link2, Loader2 } from "lucide-react";

function AdminDashboard({ currentUser, theme }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedParentId, setSelectedParentId] = useState("");

  // 🌙 Sync Tailwind dark mode class with global theme prop
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  // 🧩 Fetch all users except admin
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersCollectionRef = collection(db, COLLECTIONS.USERS);
      const snapshot = await getDocs(usersCollectionRef);
      const userList = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
      }));
      setUsers(userList.filter(u => u.userType !== "admin"));
    } catch (error) {
      console.error("Error fetching users:", error);
      alert("Could not fetch user data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const students = users.filter(u => u.userType === "student" && !u.isMapped);
  const parents = users.filter(u => u.userType === "parent" && !u.mappedStudentId);

  // 🔗 Map Student ↔ Parent
  const handleMapUser = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedParentId) {
      alert("Please select both a student and a parent to map.");
      return;
    }

    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, selectedStudentId), {
        mappedParentId: selectedParentId,
        isMapped: true,
      });
      await updateDoc(doc(db, COLLECTIONS.USERS, selectedParentId), {
        mappedStudentId: selectedStudentId,
      });
      alert("Student and Parent have been mapped successfully!");
      setSelectedStudentId("");
      setSelectedParentId("");
      fetchUsers();
    } catch (error) {
      console.error("Error mapping users:", error);
      alert("Failed to map users. Please try again.");
    }
  };

  // ❌ Remove user
  const handleRemoveUser = async (uid, email) => {
    if (
      window.confirm(
        `Are you sure you want to remove ${email}? This action deletes their profile data only.`
      )
    ) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.USERS, uid));
        alert("User data deleted from database (Firebase Auth record remains).");
        fetchUsers();
      } catch (error) {
        console.error("Error removing user:", error);
        alert("Failed to remove user data.");
      }
    }
  };

  // ⏳ Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300">
        <Loader2 className="animate-spin w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
        Loading Users...
      </div>
    );
  }

  // 🧭 Dashboard UI
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-6 transition-colors duration-500">
      {/* Header */}
      <motion.div
        initial={{ y: -15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3 mb-8"
      >
        <UserCog className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Admin Dashboard
        </h2>
      </motion.div>

      {/* Map Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-10 border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center gap-3 mb-4">
          <Link2 className="text-blue-500 dark:text-blue-400 w-6 h-6" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Map Student ↔ Parent
          </h3>
        </div>

        <form onSubmit={handleMapUser} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Select Student
            </label>
            <select
              className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 transition"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
            >
              <option value="">-- Unmapped Students --</option>
              {students.map((s) => (
                <option key={s.uid} value={s.uid}>
                  {s.name} ({s.admissionNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Select Parent
            </label>
            <select
              className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 transition"
              value={selectedParentId}
              onChange={(e) => setSelectedParentId(e.target.value)}
            >
              <option value="">-- Unmapped Parents --</option>
              {parents.map((p) => (
                <option key={p.uid} value={p.uid}>
                  {p.name} ({p.phoneNumber})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="mt-2 md:mt-0 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
          >
            Map Users
          </button>
        </form>
      </motion.div>

      {/* User Management */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center gap-3 mb-4">
          <Users className="text-green-500 dark:text-green-400 w-6 h-6" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            User Management
          </h3>
        </div>

        <UserList users={users} handleRemoveUser={handleRemoveUser} theme={theme} />
      </motion.div>
    </div>
  );
}

export default AdminDashboard;
