"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  name: string;
  username: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function StaffManagementPage() {
  const { role, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userRole, setUserRole] = useState("staff");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && role !== "owner") {
      router.push("/dashboard");
      return;
    }
    loadUsers();
  }, [authLoading, role]);

  const handleTextOnlyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      [46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
      (e.ctrlKey === true && [65, 67, 86, 88].indexOf(e.keyCode) !== -1) ||
      (e.keyCode >= 35 && e.keyCode <= 39)
    ) {
      return;
    }
    if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) {
      e.preventDefault();
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/v1/users");
      if (!res.ok) {
        throw new Error("Failed to fetch staff members");
      }
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setUsername("");
    setPassword("");
    setUserRole("staff");
    setIsActive(true);
    setSelectedUserId(null);
    setIsEditing(false);
    setError("");
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (user: User) => {
    resetForm();
    setSelectedUserId(user.id);
    setName(user.name);
    setUsername(user.username);
    setUserRole(user.role);
    setIsActive(user.isActive);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    if (!name.trim() || !username.trim()) {
      setError("Name and username are required");
      setSubmitting(false);
      return;
    }

    if (!isEditing && !password) {
      setError("Password is required for new accounts");
      setSubmitting(false);
      return;
    }

    try {
      const url = isEditing ? `/api/v1/users/${selectedUserId}` : "/api/v1/users";
      const method = isEditing ? "PUT" : "POST";
      const payload: any = {
        name,
        username,
        role: userRole,
        isActive,
      };

      if (password) {
        payload.password = password;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save user details");
      }

      setSuccess(isEditing ? "Account updated successfully!" : "New user created successfully!");
      setShowModal(false);
      resetForm();
      loadUsers();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || role !== "owner") return null;

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white p-6 rounded-lg shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Staff & Account Management</h2>
          <p className="text-sm text-gray-500">Manage user credentials, roles, and status levels</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded text-sm transition shadow-sm"
        >
          Add Staff Member
        </button>
      </div>

      {success && <div className="text-green-600 bg-green-50 p-4 rounded-lg text-sm font-semibold">{success}</div>}
      {error && <div className="text-red-600 bg-red-50 p-4 rounded-lg text-sm font-semibold">{error}</div>}

      {/* Grid of Users */}
      {loading ? (
        <div className="text-center py-10">Loading user accounts...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {users.map((user) => (
            <div
              key={user.id}
              className={`bg-white rounded-lg shadow-sm border p-6 flex flex-col justify-between transition hover:shadow-md ${
                !user.isActive ? "border-gray-200 bg-gray-50 opacity-75" : "border-gray-100"
              }`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                      user.role === "owner"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs text-gray-400">Status:</span>
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      user.isActive ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <span className="text-xs font-medium text-gray-700 capitalize">
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mt-2 text-xs text-gray-400">
                  Joined: {new Date(user.createdAt).toLocaleDateString("en-IN")}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => handleOpenEdit(user)}
                  className="text-blue-600 hover:text-blue-900 font-medium text-sm transition"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {isEditing ? "Edit Account Details" : "Create Staff Account"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lalit Menariya"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleTextOnlyKeyDown}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. lalit_staff"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Password {isEditing && <span className="text-xs text-gray-400 font-normal">(Leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  required={!isEditing}
                  placeholder="Password"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Role</label>
                <select
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                >
                  <option value="staff">Staff Member</option>
                  <option value="owner">Owner / Admin</option>
                </select>
              </div>

              {isEditing && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActiveCheckbox"
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500 rounded"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <label htmlFor="isActiveCheckbox" className="text-sm font-semibold text-gray-700">
                    Account Active (Allow Login)
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-white border border-gray-300 rounded-md py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-md py-2 px-4 text-sm font-medium disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
