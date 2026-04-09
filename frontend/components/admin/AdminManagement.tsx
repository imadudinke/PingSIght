"use client";

import { useState, useEffect } from "react";
import { Panel } from "@/components/dashboard/Panel";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { API_BASE_URL } from "@/lib/constants";

interface AdminUser {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
  granted_by?: string;
  granted_at?: string;
}

export function AdminManagement() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [actionType, setActionType] = useState<'revoke' | null>(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/admins`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setAdmins(data.admins || []);
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error("Failed to fetch admins:", errorData);
        // Handle both string errors and validation error arrays
        let errorMessage = 'Failed to fetch administrators';
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((err: any) => err.msg || 'Validation error').join(', ');
        }
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Failed to fetch admins:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAdminEmail.trim()) {
      setError("Email is required");
      return;
    }

    if (!newAdminEmail.includes('@')) {
      setError("Please enter a valid email address");
      return;
    }

    if (admins.some(admin => admin.email === newAdminEmail.trim())) {
      setError("User is already an admin");
      return;
    }

    setAddingAdmin(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/admins/by-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email: newAdminEmail.trim() }),
      });

      if (response.ok) {
        setNewAdminEmail("");
        setError(null);
        fetchAdmins(); // Refresh the list
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error("Failed to add admin:", errorData);
        // Handle both string errors and validation error arrays
        let errorMessage = 'Failed to grant admin privileges';
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((err: any) => err.msg || 'Validation error').join(', ');
        }
        setError(errorMessage);
      }
    } catch (error) {
      setError("Failed to grant admin privileges");
      console.error("Failed to add admin:", error);
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleRevokeAdmin = async () => {
    if (!selectedAdmin) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/admins/${selectedAdmin.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        fetchAdmins(); // Refresh the list
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error("Failed to revoke admin privileges:", errorData);
        // Handle both string errors and validation error arrays
        let errorMessage = 'Failed to revoke admin privileges';
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((err: any) => err.msg || 'Validation error').join(', ');
        }
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Failed to revoke admin privileges:", error);
    } finally {
      setSelectedAdmin(null);
      setActionType(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Add Admin Form */}
      <Panel className="p-4 md:p-6">
        <div className="mb-4">
          <div className="text-[#d6d7da] text-[12px] md:text-[14px] tracking-[0.18em] uppercase mb-2">
            GRANT_ADMIN_PRIVILEGES
          </div>
          <div className="text-[#6f6f6f] text-[10px] md:text-[11px] tracking-[0.10em] mb-4">
            Grant administrative privileges to existing users
          </div>
        </div>

        <form onSubmit={handleAddAdmin} className="space-y-4">
          <div>
            <label className="block text-[#6f6f6f] text-[10px] tracking-[0.22em] uppercase mb-2">
              USER_EMAIL
            </label>
            <input
              type="email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3 py-2 bg-[#0b0c0e] border border-[#1b1d20] text-[#d6d7da] text-[11px] tracking-[0.18em] placeholder-[#6f6f6f] focus:border-[#f2d48a] focus:outline-none"
              disabled={addingAdmin}
            />
          </div>

          {error && (
            <div className="text-[#ef4444] text-[10px] tracking-[0.18em] uppercase">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={addingAdmin}
            className="px-4 py-2 bg-[#f2d48a] text-[#0b0c0e] font-mono text-[10px] font-bold tracking-wider uppercase hover:bg-[#d6d7da] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addingAdmin ? 'GRANTING...' : 'GRANT_ADMIN_PRIVILEGES'}
          </button>
        </form>
      </Panel>

      {/* Current Admins */}
      <Panel className="p-0">
        <div className="px-4 md:px-6 py-4 md:py-5 border-b border-[#15171a]">
          <div className="text-[#d6d7da] text-[12px] md:text-[14px] tracking-[0.18em] uppercase">
            CURRENT_ADMINISTRATORS
          </div>
          <div className="mt-1 text-[#6f6f6f] text-[10px] md:text-[11px] tracking-[0.10em]">
            Users with administrative privileges
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="text-[#6f6f6f] text-[11px] tracking-[0.28em] uppercase animate-pulse">
                LOADING_ADMINISTRATORS...
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#15171a]">
                  <th className="text-left px-4 md:px-6 py-3 text-[#6f6f6f] text-[9px] md:text-[10px] tracking-[0.22em] uppercase font-normal">
                    ADMINISTRATOR
                  </th>
                  <th className="text-left px-4 md:px-6 py-3 text-[#6f6f6f] text-[9px] md:text-[10px] tracking-[0.22em] uppercase font-normal">
                    STATUS
                  </th>
                  <th className="text-left px-4 md:px-6 py-3 text-[#6f6f6f] text-[9px] md:text-[10px] tracking-[0.22em] uppercase font-normal">
                    GRANTED_BY
                  </th>
                  <th className="text-left px-4 md:px-6 py-3 text-[#6f6f6f] text-[9px] md:text-[10px] tracking-[0.22em] uppercase font-normal">
                    GRANTED_AT
                  </th>
                  <th className="text-left px-4 md:px-6 py-3 text-[#6f6f6f] text-[9px] md:text-[10px] tracking-[0.22em] uppercase font-normal">
                    LAST_LOGIN
                  </th>
                  <th className="text-right px-4 md:px-6 py-3 text-[#6f6f6f] text-[9px] md:text-[10px] tracking-[0.22em] uppercase font-normal">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id} className="border-b border-[#15171a] hover:bg-[rgba(242,212,138,0.02)]">
                    <td className="px-4 md:px-6 py-4">
                      <div className="text-[#d6d7da] text-[11px] tracking-[0.18em]">
                        {admin.email}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <span className="px-2 py-1 text-[9px] tracking-[0.18em] uppercase bg-[rgba(242,212,138,0.1)] text-[#f2d48a] border border-[#f2d48a] rounded">
                        ADMIN
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="text-[#6f6f6f] text-[10px] tracking-[0.18em] uppercase">
                        {admin.granted_by || 'SYSTEM'}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="text-[#6f6f6f] text-[10px] tracking-[0.18em] uppercase">
                        {admin.granted_at ? formatDate(admin.granted_at) : 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="text-[#6f6f6f] text-[10px] tracking-[0.18em] uppercase">
                        {admin.last_login ? formatDate(admin.last_login) : 'NEVER'}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-right">
                      {admin.granted_by !== 'system' && (
                        <button
                          onClick={() => {
                            setSelectedAdmin(admin);
                            setActionType('revoke');
                          }}
                          className="px-2 py-1 text-[9px] tracking-[0.18em] uppercase text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)] border border-[#ef4444] hover:border-[#ef4444] transition-all"
                        >
                          REVOKE
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {admins.length === 0 && !loading && (
          <div className="p-8 text-center">
            <div className="text-[#6f6f6f] text-[11px] tracking-[0.28em] uppercase">
              NO_ADMINISTRATORS_FOUND
            </div>
          </div>
        )}
      </Panel>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!selectedAdmin && !!actionType}
        onClose={() => {
          setSelectedAdmin(null);
          setActionType(null);
        }}
        onConfirm={handleRevokeAdmin}
        title="REVOKE_ADMIN_PRIVILEGES"
        message={`Are you sure you want to revoke admin privileges from "${selectedAdmin?.email}"? This action cannot be undone.`}
        confirmText="REVOKE"
        cancelText="CANCEL"
        variant="danger"
      />
    </div>
  );
}