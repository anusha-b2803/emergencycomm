import React from "react";
import "./UserList.css"; // We will provide the full CSS for this file

// 1. The component now accepts the 'theme' prop from AdminDashboard
function UserList({ users, handleRemoveUser, theme }) {
  if (!users || users.length === 0) {
    return (
      <p className="no-users-text">
        No users registered (excluding Admin).
      </p>
    );
  }

  return (
    // 2. The 'theme' prop is used to apply a dynamic class for CSS targeting
    <div className={`user-list-container ${theme}-mode`}>
      <h2 className="table-title">Registered Users</h2>

      <div className="table-wrapper"> {/* Added wrapper for overflow scrolling */}
        <table className="user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Email</th>
              <th>ID / Phone</th>
              <th>Mapped To</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.uid}>
                <td>{user.name || "—"}</td>
                <td>
                  <span className={`type-badge ${user.userType}`}>
                    {user.userType}
                  </span>
                </td>
                <td>{user.email}</td>
                <td>
                  {user.userType === "student"
                    ? user.admissionNumber || "—"
                    : user.phoneNumber || "—"}
                </td>
                <td>
                  {user.userType === "student"
                    ? user.isMapped
                      ? `Parent: ${user.mappedParentId?.substring(0, 6)}…`
                      : <span className="status-unmapped">Not Mapped</span>
                    : user.mappedStudentId
                    ? `Student: ${user.mappedStudentId?.substring(0, 6)}…`
                    : <span className="status-unmapped">Not Mapped</span>}
                </td>
                <td>
                  <button
                    className="btn-remove"
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
    </div>
  );
}

export default UserList;