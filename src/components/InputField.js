import React from "react";

function UserList({ users, handleRemoveUser }) {
  if (!users || users.length === 0) {
    return <p className="text-center text-gray-500 mt-4">No users registered (excluding Admin).</p>;
  }

  return (
    <div className="overflow-x-auto bg-white shadow-lg rounded-xl p-6 mt-4">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Registered Users</h2>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {["Name", "Type", "Email", "ID / Phone", "Mapped To", "Action"].map((h) => (
              <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.uid} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-2">{user.name || "—"}</td>
              <td className={`px-4 py-2 font-semibold ${user.userType === "student" ? "text-blue-600" : "text-green-600"}`}>
                {user.userType.toUpperCase()}
              </td>
              <td className="px-4 py-2">{user.email}</td>
              <td className="px-4 py-2">{user.userType === "student" ? user.admissionNumber || "—" : user.phoneNumber || "—"}</td>
              <td className="px-4 py-2">
                {user.userType === "student"
                  ? user.isMapped
                    ? `Parent: ${user.mappedParentId?.substring(0, 6)}…`
                    : "Not Mapped"
                  : user.mappedStudentId
                  ? `Student: ${user.mappedStudentId?.substring(0, 6)}…`
                  : "Not Mapped"}
              </td>
              <td className="px-4 py-2">
                <button
                  className="px-3 py-1 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-all"
                  onClick={() => handleRemoveUser(user.uid, user.email)}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserList;
