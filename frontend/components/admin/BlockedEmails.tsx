"use client";

import { useState, useEffect } from "react";
import { Panel } from "@/components/dashboard/Panel";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { API_BASE_URL } from "@/lib/constants";

interface BlockedEmail {
  id: string;
  email: string;
  reason: string;
  blocked_by: string;
  blocked_at: string;
  attempts_count?: number;
}

export function BlockedEmails() {
  const [blockedEmails, setBlockedEmails] = useState<BlockedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBlockEmail, setNewBlockEmail] = useState("");
  const [newBlockReason, setNewBlockReason] = useState("");
  const [addingBlock, setAddingBlock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<BlockedEmail | null>(null);
  const [actionType, setActionType] = useState<'unblock' | null>(null);

  useEffect(() => {
    fetchBlockedEmails();
  }, []);

  const fetchBlockedEmails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/blocked-emails`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setBlockedEmails(data.blocked_emails || []);
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error("Failed to fetch blocked emails:", errorData);
        // Handle both string errors and validation error arrays
        let errorMessage = 'Failed to fetch blocked emails';
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((err: any) => err.msg || 'Validation error').join(', ');
        }
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Failed to fetch blocked emails:", error);
      setError("Failed to fetch blocked emails");
    } finally {
      setLoading(false);
    }
  };

  const handleBlockEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!newBlockEmail.trim()) {
      setError("Email is required");
      return;
    }

    if (!newBlockEmail.includes('@')) {
      setError("Please enter a valid email address");
      return;
    }

    if (!newBlockReason.trim()) {
      setError("Reason is required");
      return;
    }

    if (blockedEmails.some(blocked => blocked.email === newBlockEmail.trim())) {
      setError("Email is already blocked");
      return;
    }

    setAddingBlock(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/blocked-emails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: newBlockEmail.trim(),
          reason: newBlockReason.trim()
        }),
      });

      if (response.ok) {
        setNewBlockEmail("");
        setNewBlockReason("");
        await fetchBlockedEmails(); // Refresh the list
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error("Failed to block email:", errorData);
        // Handle both string errors and validation error arrays
        let errorMessage = 'Failed to block email';
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((err: any) => err.msg || 'Validation error').join(', ');
        }
        setError(errorMessage);
      }
    } catch (error) {
      setError("Failed to block email");
      console.error("Failed to block email:", error);
    } finally {
      setAddingBlock(false);
    }
  };

  const handleUnblockEmail = async () => {
    if (!selectedEmail) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/blocked-emails/${selectedEmail.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        await fetchBlockedEmails(); // Refresh the list
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error("Failed to unblock email:", errorData);
        // Handle both string errors and validation error arrays
        let errorMessage = 'Failed to unblock email';
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((err: any) => err.msg || 'Validation error').join(', ');
        }
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Failed to unblock email:", error);
      setError("Failed to unblock email");
    } finally {
      setSelectedEmail(null);
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

  const commonReasons = [
    "Suspicious activity detected",
    "Terms of service violation",
    "Spam or abuse reports",
    "Automated registration attempts",
    "Security threat",
    "Manual review required"
  ];

  return (
    <div className="space-y-6">
      {/* Block Email Form */}
      <Panel className="p-4 md:p-6">
        <div className="mb-4">
          <div className="text-[#d6d7da] text-[12px] md:text-[14px] tracking-[0.18em] uppercase mb-2">
            BLOCK_EMAIL_ADDRESS
          </div>
          <div className="text-[#6f6f6f] text-[10px] md:text-[11px] tracking-[0.10em] mb-4">
            Prevent specific email addresses from registering or accessing the system
          </div>
        </div>

        <form onSubmit={handleBlockEmail} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#6f6f6f] text-[10px] tracking-[0.22em] uppercase mb-2">
                EMAIL_ADDRESS
              </label>
              <input
                type="email"
                value={newBlockEmail}
                onChange={(e) => setNewBlockEmail(e.target.value)}
                placeholder="user@domain.com"
                className="w-full px-3 py-2 bg-[#0b0c0e] border border-[#1b1d20] text-[#d6d7da] text-[11px] tracking-[0.18em] placeholder-[#6f6f6f] focus:border-[#f2d48a] focus:outline-none"
                disabled={addingBlock}
              />
            </div>

            <div>
              <label className="block text-[#6f6f6f] text-[10px] tracking-[0.22em] uppercase mb-2">
                REASON
              </label>
              <select
                value={newBlockReason}
                onChange={(e) => setNewBlockReason(e.target.value)}
                className="w-full px-3 py-2 bg-[#0b0c0e] border border-[#1b1d20] text-[#d6d7da] text-[11px] tracking-[0.18em] focus:border-[#f2d48a] focus:outline-none"
                disabled={addingBlock}
              >
                <option value="">Select reason...</option>
                {commonReasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[#6f6f6f] text-[10px] tracking-[0.22em] uppercase mb-2">
              CUSTOM_REASON (OPTIONAL)
            </label>
            <input
              type="text"
              value={newBlockReason}
              onChange={(e) => setNewBlockReason(e.target.value)}
              placeholder="Enter custom reason..."
              className="w-full px-3 py-2 bg-[#0b0c0e] border border-[#1b1d20] text-[#d6d7da] text-[11px] tracking-[0.18em] placeholder-[#6f6f6f] focus:border-[#f2d48a] focus:outline-none"
              disabled={addingBlock}
            />
          </div>

          {error && (
            <div className="text-[#ef4444] text-[10px] tracking-[0.18em] uppercase">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={addingBlock}
            className="px-4 py-2 bg-[#ef4444] text-[#ffffff] font-mono text-[10px] font-bold tracking-wider uppercase hover:bg-[#dc2626] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addingBlock ? 'BLOCKING...' : 'BLOCK_EMAIL'}
          </button>
        </form>
      </Panel>

      {/* Blocked Emails List */}
      <Panel className="p-0">
        <div className="px-4 md:px-6 py-4 md:py-5 border-b border-[#15171a]">
          <div className="text-[#d6d7da] text-[12px] md:text-[14px] tracking-[0.18em] uppercase">
            BLOCKED_EMAIL_ADDRESSES
          </div>
          <div className="mt-1 text-[#6f6f6f] text-[10px] md:text-[11px] tracking-[0.10em]">
            Currently blocked email addresses and domains
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="text-[#6f6f6f] text-[11px] tracking-[0.28em] uppercase animate-pulse">
                LOADING_BLOCKED_EMAILS...
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#15171a]">
                  <th className="text-left px-4 md:px-6 py-3 text-[#6f6f6f] text-[9px] md:text-[10px] tracking-[0.22em] uppercase font-normal">
                    EMAIL_ADDRESS
                  </th>
                  <th className="text-left px-4 md:px-6 py-3 text-[#6f6f6f] text-[9px] md:text-[10px] tracking-[0.22em] uppercase font-normal">
                    REASON
                  </th>
                  <th className="text-left px-4 md:px-6 py-3 text-[#6f6f6f] text-[9px] md:text-[10px] tracking-[0.22em] uppercase font-normal">
                    ATTEMPTS
                  </th>
                  <th className="text-left px-4 md:px-6 py-3 text-[#6f6f6f] text-[9px] md:text-[10px] tracking-[0.22em] uppercase font-normal">
                    BLOCKED_BY
                  </th>
                  <th className="text-left px-4 md:px-6 py-3 text-[#6f6f6f] text-[9px] md:text-[10px] tracking-[0.22em] uppercase font-normal">
                    BLOCKED_AT
                  </th>
                  <th className="text-right px-4 md:px-6 py-3 text-[#6f6f6f] text-[9px] md:text-[10px] tracking-[0.22em] uppercase font-normal">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {blockedEmails.map((blocked) => (
                  <tr key={blocked.id} className="border-b border-[#15171a] hover:bg-[rgba(239,68,68,0.02)]">
                    <td className="px-4 md:px-6 py-4">
                      <div className="text-[#d6d7da] text-[11px] tracking-[0.18em] font-mono">
                        {blocked.email}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="text-[#6f6f6f] text-[10px] tracking-[0.18em] max-w-xs truncate">
                        {blocked.reason}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="text-[#ef4444] text-[11px] tracking-[0.18em] font-mono">
                        {blocked.attempts_count || 0}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="text-[#6f6f6f] text-[10px] tracking-[0.18em] uppercase">
                        {blocked.blocked_by}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="text-[#6f6f6f] text-[10px] tracking-[0.18em] uppercase">
                        {formatDate(blocked.blocked_at)}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedEmail(blocked);
                          setActionType('unblock');
                        }}
                        className="px-2 py-1 text-[9px] tracking-[0.18em] uppercase text-[#10b981] hover:bg-[rgba(16,185,129,0.1)] border border-[#10b981] hover:border-[#10b981] transition-all"
                      >
                        UNBLOCK
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {blockedEmails.length === 0 && !loading && (
          <div className="p-8 text-center">
            <div className="text-[#6f6f6f] text-[11px] tracking-[0.28em] uppercase">
              NO_BLOCKED_EMAILS
            </div>
            <div className="text-[#5f636a] text-[10px] tracking-[0.20em] mt-2">
              No email addresses are currently blocked
            </div>
          </div>
        )}
      </Panel>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!selectedEmail && !!actionType}
        onClose={() => {
          setSelectedEmail(null);
          setActionType(null);
        }}
        onConfirm={handleUnblockEmail}
        title="UNBLOCK_EMAIL_ADDRESS"
        message={`Are you sure you want to unblock "${selectedEmail?.email}"? This will allow the email address to register and access the system again.`}
        confirmText="UNBLOCK"
        cancelText="CANCEL"
        variant="info"
      />
    </div>
  );
}