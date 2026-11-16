"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Loader, Send } from "lucide-react";
import Swal from "sweetalert2";
import { getWorkerNotesAPI, addWorkerNoteAPI } from "../../../../api/adminV1/workerAPI";
import { apiError } from "../../../../api/javaApi";
import { formatDate } from "../../utils/workerUtils";

const NOTE_MAX = 2000;

// Admin notes about a worker. Append-only: there is no edit or delete.
// Reading needs workers.view_comments; adding needs workers.edit (canAdd).
const WorkerCommentsModal = ({ isOpen, onClose, workerId, workerName, canAdd }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!workerId) return;
    setLoading(true);
    try {
      const result = await getWorkerNotesAPI(workerId, { size: 100 });
      setNotes(result?.content || []);
    } catch (error) {
      Swal.fire({ icon: "error", title: "Could not load notes", text: apiError(error).message });
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    if (isOpen && workerId) {
      setDraft("");
      fetchNotes();
    }
  }, [isOpen, workerId, fetchNotes]);

  const handleAdd = async () => {
    const note = draft.trim();
    if (!note) return;
    setSaving(true);
    try {
      const created = await addWorkerNoteAPI(workerId, note);
      setNotes((prev) => [created, ...prev]);
      setDraft("");
    } catch (error) {
      Swal.fire({ icon: "error", title: "Could not add note", text: apiError(error).message });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-800">Admin Notes</h2>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-2 bg-gray-50 border-b border-gray-100 text-sm text-gray-600">
              Worker: <span className="font-medium text-gray-800">{workerName}</span>
            </div>

            {canAdd && (
              <div className="px-6 py-4 border-b border-gray-100">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.slice(0, NOTE_MAX))}
                  rows={3}
                  placeholder="Add a note about this worker. Notes can't be edited or deleted later."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">
                    {draft.length}/{NOTE_MAX}
                  </span>
                  <button
                    onClick={handleAdd}
                    disabled={saving || !draft.trim()}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Add Note
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-lg font-medium">No notes yet</p>
                  <p className="text-sm mt-1">No admin notes have been added for this worker.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notes.map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <p className="text-gray-800 whitespace-pre-wrap break-words">{item.note}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {item.createdBy} · {formatDate(item.createdAt, true)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
