import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { Inter } from "next/font/google";
import TaskCard from "@/components/TaskCard";
import TaskForm from "@/components/TaskForm";
import TaskFilters from "@/components/TaskFilters";
import Pagination from "@/components/Pagination";
import Loading from "@/components/Loading";
import Modal from "@/components/Modal";
import { useToast } from "@/contexts/ToastContext";
import api from '@/utils/api';

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    pages: 1,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await api.get('/users/profile');
        setUser(response.data);
        setIsAuthenticated(true);
        fetchTasks();
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("token");
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      }).toString();

      const response = await api.get(`/tasks?${queryParams}`);
      if (response.data.tasks) {
        setTasks(response.data.tasks);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      addToast(error.response?.data?.message || "Error fetching tasks", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks();
    }
  }, [isAuthenticated, filters, pagination.page]);

  const handleCreateTask = async (taskData) => {
    try {
      await api.post("/tasks", taskData);
      addToast("Task created successfully", "success");
      fetchTasks();
      setIsFormOpen(false);
    } catch (error) {
      addToast(error.response?.data?.message || "Failed to create task", "error");
    }
  };

  const handleUpdateTask = async (taskData) => {
    try {
      await api.put(`/tasks/${editingTask._id}`, taskData);
      addToast("Task updated successfully", "success");
      fetchTasks();
      setEditingTask(null);
    } catch (error) {
      addToast(error.response?.data?.message || "Failed to update task", "error");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await api.delete(`/tasks/${taskId}`);
        addToast("Task deleted successfully", "success");
        fetchTasks();
      } catch (error) {
        addToast(error.response?.data?.message || "Failed to delete task", "error");
      }
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={`${inter.variable} min-h-screen bg-background`}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Task Management System</h1>
          <div className="flex gap-4">
            {user?.role === "admin" && (
              <button
                onClick={() => router.push("/admin/dashboard")}
                className="bg-secondary-600 text-white px-4 py-2 rounded hover:bg-secondary-700"
              >
                Admin Dashboard
              </button>
            )}
            <button
              onClick={() => router.push("/profile")}
              className="bg-secondary-600 text-white px-4 py-2 rounded hover:bg-secondary-700"
            >
              Profile
            </button>
            <button
              onClick={() => setIsFormOpen(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
            >
              New Task
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                router.push("/login");
              }}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>

        <TaskFilters onFilterChange={setFilters} />

        {(isFormOpen || editingTask) && (
          <Modal
            isOpen={true}
            onClose={() => {
              setIsFormOpen(false);
              setEditingTask(null);
            }}
            title={editingTask ? "Edit Task" : "Create New Task"}
          >
            <TaskForm
              task={editingTask}
              onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingTask(null);
              }}
            />
          </Modal>
        )}

        {isLoading && <Loading />}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onEdit={setEditingTask}
              onDelete={handleDeleteTask}
            />
          ))}
        </div>

        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        />
      </main>
    </div>
  );
}
