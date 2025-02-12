import { useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import { useToast } from "../contexts/ToastContext";


const TaskList = () => {
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });
  const { showToast } = useToast();

  const handleDeleteTask = (taskId, taskTitle) => {
    setConfirmDialog({
      open: true,
      title: "Delete Task",
      message: `Are you sure you want to delete task "${taskTitle}"?`,
      onConfirm: async () => {
        try {
          await api.delete(`/tasks/${taskId}`);
          showToast("Task deleted successfully", "success");
          fetchTasks();
        } catch (error) {
          showToast(
            error.response?.data?.message || "Error deleting task",
            "error"
          );
        }
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
  };

  const handleUpdateTask = (taskId, taskData) => {
    setConfirmDialog({
      open: true,
      title: "Update Task",
      message: "Are you sure you want to update this task?",
      onConfirm: async () => {
        try {
          await api.put(`/tasks/${taskId}`, taskData);
          showToast("Task updated successfully", "success");
          fetchTasks();
        } catch (error) {
          showToast(
            error.response?.data?.message || "Error updating task",
            "error"
          );
        }
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
  };

  return (
    <div>
    
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
      />
    </div>
  );
};
