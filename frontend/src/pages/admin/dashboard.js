import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Pagination from "@/components/Pagination";
import { useToast } from "@/contexts/ToastContext";
import ConfirmDialog from "../../components/ConfirmDialog";
import api from "@/utils/api";

export default function AdminDashboard() {
  const router = useRouter();
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit
      }).toString();

      const response = await api.get(`/users?${queryParams}`);
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch users");
      addToast(error.response?.data?.message || "Failed to fetch users", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/users/${userId}/role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (res.ok) {
        addToast("User role updated successfully", "success");
        fetchUsers();
      } else {
        const data = await res.json();
        addToast(data.message || "Failed to update user role", "error");
      }
    } catch (error) {
      addToast("Error updating user role", "error");
      console.error("Error updating role:", error);
    }
  };

  const deleteUser = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/admin/users/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        addToast("User deleted successfully", "success");
        setUsers(users.filter((user) => user._id !== userId));
      } else {
        const data = await response.json();
        addToast(data.message || "Failed to delete user", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      addToast("Error deleting user", "error");
    }
  };


  useEffect(() => {
    if (pagination.page) {
      fetchUsers();
    }
  }, [pagination.page]);

  const handleDeleteUser = async (userId, userName) => {
    setConfirmDialog({
      open: true,
      title: "Delete User",
      message: `Are you sure you want to delete user "${userName}"? This action will also delete all tasks associated with this user.`,
      onConfirm: async () => {
        try {
          await api.delete(`/users/${userId}`);
          addToast("User deleted successfully", "success");
          setUsers(users.filter(user => user._id !== userId));
        } catch (error) {
          addToast(error.response?.data?.message || "Error deleting user", "error");
        }
        setConfirmDialog({ ...confirmDialog, open: false });
      }
    });
  };


  const handleUpdateRole = async (userId, userName, newRole) => {
    setConfirmDialog({
      open: true,
      title: "Update User Role",
      message: `Are you sure you want to change ${userName}'s role to ${newRole}?`,
      onConfirm: async () => {
        try {
          await api.patch(`/users/${userId}/role`, { role: newRole });
          addToast("User role updated successfully", "success");
          fetchUsers();
        } catch (error) {
          addToast(error.response?.data?.message || "Failed to update user role", "error");
        }
        setConfirmDialog({ ...confirmDialog, open: false });
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <button
            onClick={() => router.push("/")}
            className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
          >
            Back to Tasks
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded mb-4">{error}</div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-300">
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleUpdateRole(user._id, user.name, e.target.value)
                      }
                      className="text-sm rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleDeleteUser(user._id, user.name)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        />
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
      />
    </div>
  );
}
