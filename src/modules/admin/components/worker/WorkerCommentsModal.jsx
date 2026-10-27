"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, MessageCircle, Loader, Star } from "lucide-react";
import Swal from "sweetalert2";
import {
  getWorkerCommentsAPI,
  deleteWorkerCommentAPI,
} from "../../../../api/admin/adminWorkerAPI";

const WorkerCommentsModal = ({ isOpen, onClose, workerId, workerName }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchComments = async () => {
    if (!workerId) return;
    setLoading(true);
    try {
      const response = await getWorkerCommentsAPI(workerId);
      // API response structure: { status: 200, data: [...] }
      let commentsData = [];
      if (response?.data && Array.isArray(response.data)) {
        commentsData = response.data;
      } else if (Array.isArray(response)) {
        commentsData = response;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        commentsData = response.data.data;
      }
      setComments(commentsData);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Could not load comments.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && workerId) {
      fetchComments();
    }
  }, [isOpen, workerId]);

  const handleDeleteComment = async (commentId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This comment will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });
    if (!result.isConfirmed) return;

    setDeletingId(commentId);
    try {
      await deleteWorkerCommentAPI(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Delete comment failed:", error);
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Could not delete comment.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Helper to render star rating
  const renderRating = (rating) => {
    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating === 0) return null;
    return (
      <div className="flex items-center gap-1 mt-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={14}
            className={
              i < numericRating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }
          />
        ))}
        <span className="text-xs text-gray-500 ml-1">({numericRating}/5)</span>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-800">
                  Comments & Feedback
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Subheader */}
            <div className="px-6 py-2 bg-gray-50 border-b border-gray-100 text-sm text-gray-600">
              Worker:{" "}
              <span className="font-medium text-gray-800">
                {workerName || `ID: ${workerId}`}
              </span>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-lg font-medium">No comments yet</p>
                  <p className="text-sm mt-1">
                    No feedback or comments found for this worker.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-50 rounded-xl p-4 border border-gray-200 relative group"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          {/* Rating stars */}
                          {item.rating && renderRating(item.rating)}

                          {/* Comment text */}
                          <p className="text-gray-800 whitespace-pre-wrap break-words mt-2">
                            {item.comment || "No comment text"}
                          </p>

                          {/* Company info if available */}
                          {item.company && (
                            <p className="text-xs text-gray-500 mt-2">
                              Company: {item.company.company_name} (
                              {item.company.company_code})
                            </p>
                          )}

                          {/* Created date */}
                          {item.created_at && (
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(item.created_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteComment(item.id)}
                          disabled={deletingId === item.id}
                          className="ml-3 text-gray-400 hover:text-red-600 transition disabled:opacity-50"
                          title="Delete comment"
                        >
                          {deletingId === item.id ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 text-right">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WorkerCommentsModal;
