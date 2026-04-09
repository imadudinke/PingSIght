"use client";

import { useState, useEffect, useCallback } from "react";
import { Panel } from "@/components/dashboard/Panel";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { API_BASE_URL } from "@/lib/constants";

interface User {
  id: string;
  email: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  last_login?: string;
  monitor_count: number;
  status_page_count: number;
}

export function UserManagement() {
  const USERS_PER_PAGE = 5;
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<'email' | 'created_at' | 'monitor_count'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'activate' | 'deactivate' | 'delete' | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/users?sort_by=${sortBy}&sort_order=${sortOrder}&search=${encodeURIComponent(searchTerm)}`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        console.error("Failed to fetch users:", response.status);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, sortBy, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users
    .filter(user => 
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const pageStartIndex = (currentPage - 1) * USERS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(pageStartIndex, pageStartIndex + USERS_PER_PAGE);
  const pageEndIndex = Math.min(pageStartIndex + USERS_PER_PAGE, filteredUsers.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, sortOrder]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleUserAction = async () => {
    if (!selectedUser || !actionType) return;

    try {
      let endpoint = "";
      let method = "PUT";
      
      if (actionType === 'delete') {
        endpoint = `${API_BASE_URL}/api/admin/users/${selectedUser.id}`;
        method = "DELETE";
      } else if (actionType === 'activate') {
        endpoint = `${API_BASE_URL}/api/admin/users/${selectedUser.id}/activate`;
      } else if (actionType === 'deactivate') {
        endpoint = `${API_BASE_URL}/api/admin/users/${selectedUser.id}/deactivate`;
      }

      const response = await fetch(endpoint, {
        method,
        credentials: "include",
      });

      if (response.ok) {
        // Refresh the users list
        fetchUsers();
      } else {
        console.error(`Failed to ${actionType} user:`, response.status);
      }
    } catch (error) {
      console.error(`Failed to ${actionType} user:`, error);
    } finally {
      setSelectedUser(null);
      setActionType(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (user: User) => {
    if (!user.is_active) {
      return (
        <span className="px-2 py-1 text-[9px] tracking-[0.18em] uppercase bg-[rgba(239,68,68,0.1)] text-[#ef4444] border border-[#ef4444] rounded">
          INACTIVE
        </span>
      );
    }
    
    if (user.is_admin) {
      return (
        <span className="px-2 py-1 text-[9px] tracking-[0.18em] uppercase bg-[rgba(242,212,138,0.1)] text-[#f2d48a] border border-[#f2d48a] rounded">
          ADMIN
        </span>
      );
    }
    
    return (
      <span className="px-2 py-1 text-[9px] tracking-[0.18em] uppercase bg-[rgba(16,185,129,0.1)] text-[#10b981] border border-[#10b981] rounded">
        ACTIVE
      </span>
    );
  };

  return (
    <Panel className="p-0">
      {/* Header */}
      <div className="px-4 md:px-6 py-4 md:py-5 border-b border-[#15171a]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-[#d6d7da] text-[12px] md:text-[14px] tracking-[0.18em] uppercase">
              USER_MANAGEMENT
            </div>
            <div className="mt-1 text-[#6f6f6f] text-[10px] md:text-[11px] tracking-[0.10em]">
              Manage user accounts and permissions
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 bg-[#0b0c0e] border border-[#1b1d20] text-[#d6d7da] text-[11px] tracking-[0.18em] placeholder-[#6f6f6f] focus:border-[#f2d48a] focus:outline-none"
            />
            
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                if (field === 'email' || field === 'created_at' || field === 'monitor_count') {
                  setSortBy(field);
                }
                if (order === 'asc' || order === 'desc') {
                  setSortOrder(order);
                }
              }}
              className="px-3 py-2 bg-[#0b0c0e] border border-[#1b1d20] text-[#d6d7da] text-[11px] tracking-[0.18em] focus:border-[#f2d48a] focus:outline-none"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="email-asc">Email A-Z</option>
              <option value="email-desc">Email Z-A</option>
              <option value="monitor_count-desc">Most Monitors</option>
              <option value="monitor_count-asc">Least Monitors</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="text-[#6f6f6f] text-[11px] tracking-[0.28em] uppercase animate-pulse">
              LOADING_USERS...
            </div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#15171a]">
                <th className="text-left px-4 md:px-6 py-3 text-[#6f6f6f] text-[9px] md:text-[10px] tracking-[0.22em] uppercase font-normal">
                  USER
                </th>
                <th className="text-left px-4 md:px-6 py-3 text-[#6f6f6f] text-[9px] md:text-[10px] tracking-[0.22em] uppercase font-normal">
                  STATUS
                </th>
                <th className="text-left px-4 md:px-6 py-3 text-[#6f6f6f] text-[9px] md:text-[10px] tracking-[0.22em] uppercase font-normal">
                  MONITORS
                </th>
                <th className="text-left px-4 md:px-6 py-3 text-[#6f6f6f] text-[9px] md:text-[10px] tracking-[0.22em] uppercase font-normal">
                  PAGES
                </th>
                <th className="text-left px-4 md:px-6 py-3 text-[#6f6f6f] text-[9px] md:text-[10px] tracking-[0.22em] uppercase font-normal">
                  JOINED
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
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="border-b border-[#15171a] hover:bg-[rgba(242,212,138,0.02)]">
                  <td className="px-4 md:px-6 py-4">
                    <div className="text-[#d6d7da] text-[11px] tracking-[0.18em]">
                      {user.email}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    {getStatusBadge(user)}
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <div className="text-[#d6d7da] text-[11px] tracking-[0.18em]">
                      {user.monitor_count}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <div className="text-[#d6d7da] text-[11px] tracking-[0.18em]">
                      {user.status_page_count}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <div className="text-[#6f6f6f] text-[10px] tracking-[0.18em] uppercase">
                      {formatDate(user.created_at)}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <div className="text-[#6f6f6f] text-[10px] tracking-[0.18em] uppercase">
                      {user.last_login ? formatDate(user.last_login) : 'NEVER'}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {user.is_active ? (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setActionType('deactivate');
                          }}
                          className="px-2 py-1 text-[9px] tracking-[0.18em] uppercase text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)] border border-[#ef4444] hover:border-[#ef4444] transition-all"
                        >
                          DEACTIVATE
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setActionType('activate');
                          }}
                          className="px-2 py-1 text-[9px] tracking-[0.18em] uppercase text-[#10b981] hover:bg-[rgba(16,185,129,0.1)] border border-[#10b981] hover:border-[#10b981] transition-all"
                        >
                          ACTIVATE
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setActionType('delete');
                        }}
                        className="px-2 py-1 text-[9px] tracking-[0.18em] uppercase text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)] border border-[#ef4444] hover:border-[#ef4444] transition-all"
                      >
                        DELETE
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filteredUsers.length === 0 && !loading && (
        <div className="p-8 text-center">
          <div className="text-[#6f6f6f] text-[11px] tracking-[0.28em] uppercase">
            NO_USERS_FOUND
          </div>
        </div>
      )}

      {filteredUsers.length > 0 && (
        <div className="px-4 md:px-6 py-4 border-t border-[#15171a] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-[#6f6f6f] text-[10px] tracking-[0.18em] uppercase">
            SHOWING_{pageStartIndex + 1}-{pageEndIndex}_OF_{filteredUsers.length}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-[10px] tracking-[0.18em] uppercase border border-[#1b1d20] text-[#d6d7da] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#2a2d31] transition-all"
            >
              PREV
            </button>

            <span className="px-2 text-[#6f6f6f] text-[10px] tracking-[0.18em] uppercase">
              PAGE_{currentPage}/{totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1 text-[10px] tracking-[0.18em] uppercase border border-[#1b1d20] text-[#d6d7da] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#2a2d31] transition-all"
            >
              NEXT
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!selectedUser && !!actionType}
        onClose={() => {
          setSelectedUser(null);
          setActionType(null);
        }}
        onConfirm={handleUserAction}
        title={`${actionType?.toUpperCase()}_USER`}
        message={`Are you sure you want to ${actionType} user "${selectedUser?.email}"?`}
        confirmText={actionType?.toUpperCase() || 'CONFIRM'}
        cancelText="CANCEL"
        variant={actionType === 'delete' ? 'danger' : 'info'}
      />
    </Panel>
  );
}