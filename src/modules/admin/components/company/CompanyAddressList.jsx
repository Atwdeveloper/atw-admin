"use client";

import { MapPin, Star, Edit2, Trash2, Loader2, Plus } from "lucide-react";
import { addressTypeLabel, describeCompanyAddress } from "../../utils/companyUtils";

// Address cards with Edit / Make Primary / Delete. Purely presentational —
// the parent decides what each action does (local list or API).
const CompanyAddressList = ({ addresses, geo, editable, busyId, onAdd, onEdit, onMakePrimary, onDelete, error }) => (
  <div className="space-y-3">
    {addresses.length === 0 && (
      <div className={`text-center py-6 rounded-xl border border-dashed ${error ? "border-red-400" : "border-gray-300"}`}>
        <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No address added yet.</p>
      </div>
    )}
    {addresses.map((addr) => {
      const key = addr.id || addr._key;
      const busy = busyId === key;
      return (
        <div
          key={key}
          className={`flex flex-col sm:flex-row sm:items-start gap-3 p-4 rounded-xl border ${addr.primary ? "border-blue-300 bg-blue-50/40" : "border-gray-200 bg-white"}`}
        >
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                {addressTypeLabel(addr.addressType)}
              </span>
              {addr.primary && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white">
                  <Star className="w-3 h-3 fill-current" /> Primary
                </span>
              )}
            </div>
            <p className="text-sm text-gray-800 break-words">{describeCompanyAddress(addr, geo) || "—"}</p>
          </div>
          {editable && (
            <div className="flex items-center gap-1 shrink-0">
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-600 m-2" />
              ) : (
                <>
                  {!addr.primary && (
                    <button
                      type="button"
                      onClick={() => onMakePrimary(addr)}
                      className="px-2.5 py-1.5 text-xs font-medium text-blue-700 rounded-lg hover:bg-blue-50"
                      title="Make this the primary address"
                    >
                      Make Primary
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onEdit(addr)}
                    className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-800"
                    title="Edit address"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(addr)}
                    className="p-2 text-gray-500 rounded-lg hover:bg-red-50 hover:text-red-600"
                    title="Delete address"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      );
    })}
    {editable && (
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100"
      >
        <Plus size={16} />
        {addresses.length ? "Add Another Address" : "Add Address"}
      </button>
    )}
  </div>
);

export default CompanyAddressList;
