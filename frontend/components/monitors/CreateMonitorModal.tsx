"use client";

import { useState } from "react";
import { createMonitorMonitorsPost, createHeartbeatMonitorMonitorsHeartbeatPost } from "@/lib/api/sdk.gen";
import type { MonitorCreate, ScenarioStep } from "@/lib/api/types.gen";

interface CreateMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type MonitorType = "simple" | "scenario" | "heartbeat";

export function CreateMonitorModal({ isOpen, onClose, onSuccess }: CreateMonitorModalProps) {
  const [monitorType, setMonitorType] = useState<MonitorType>("simple");
  const [friendlyName, setFriendlyName] = useState("");
  const [url, setUrl] = useState("");
  const [intervalSeconds, setIntervalSeconds] = useState(60);
  const [steps, setSteps] = useState<ScenarioStep[]>([
    { name: "", url: "", order: 1, required_keyword: "" }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Heartbeat URL state
  const [showHeartbeatUrl, setShowHeartbeatUrl] = useState(false);
  const [heartbeatUrl, setHeartbeatUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleAddStep = () => {
    if (steps.length < 3) {
      setSteps([...steps, { name: "", url: "", order: steps.length + 1, required_keyword: "" }]);
    }
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    // Reorder remaining steps
    const reorderedSteps = newSteps.map((step, i) => ({ ...step, order: i + 1 }));
    setSteps(reorderedSteps);
  };

  const handleStepChange = (index: number, field: keyof ScenarioStep, value: string | number) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const handleCopyUrl = async () => {
    if (heartbeatUrl) {
      try {
        await navigator.clipboard.writeText(heartbeatUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (monitorType === "heartbeat") {
        // Create heartbeat monitor
        const response = await createHeartbeatMonitorMonitorsHeartbeatPost({
          body: {
            friendly_name: friendlyName,
            interval_seconds: intervalSeconds,
            monitor_type: "heartbeat"
          }
        });

        if (response.response.ok && response.data) {
          // Show heartbeat URL instead of closing immediately
          setHeartbeatUrl(response.data.heartbeat_url || null);
          setShowHeartbeatUrl(true);
          onSuccess();
        } else {
          setError("Failed to create heartbeat monitor");
        }
      } else {
        // Create simple or scenario monitor
        const monitorData: MonitorCreate = {
          url: url,
          friendly_name: friendlyName,
          interval_seconds: intervalSeconds,
          monitor_type: monitorType,
          steps: monitorType === "scenario" ? steps.filter(s => s.name && s.url) : null
        };

        const response = await createMonitorMonitorsPost({
          body: monitorData
        });

        if (response.response.ok) {
          onSuccess();
          handleClose();
        } else {
          setError("Failed to create monitor");
        }
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred while creating the monitor");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFriendlyName("");
    setUrl("");
    setIntervalSeconds(60);
    setSteps([{ name: "", url: "", order: 1, required_keyword: "" }]);
    setError(null);
    setMonitorType("simple");
    setShowHeartbeatUrl(false);
    setHeartbeatUrl(null);
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0f1113] border border-[#1f2227] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#1f2227] flex items-center justify-between">
          <h2 className="text-[#d6d7da] text-[14px] tracking-[0.18em] uppercase font-mono">
            CREATE_NEW_MONITOR
          </h2>
          <button
            onClick={handleClose}
            className="text-[#6b6f76] hover:text-[#d6d7da] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-[#ff6a6a]/10 border border-[#ff6a6a]/30 px-4 py-3 text-[#ff6a6a] text-xs font-mono">
              ERROR: {error}
            </div>
          )}

          {/* Heartbeat URL Success Display */}
          {showHeartbeatUrl && heartbeatUrl ? (
            <div className="space-y-6">
              {/* Success Message */}
              <div className="bg-[#f2d48a]/10 border border-[#f2d48a]/30 px-4 py-3">
                <div className="flex items-center gap-2 text-[#f2d48a] text-xs font-mono tracking-wider uppercase mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  HEARTBEAT_MONITOR_CREATED
                </div>
                <p className="text-[#d6d7da] text-[10px] font-mono leading-relaxed">
                  Your heartbeat monitor has been created successfully. Use the URL below in your scripts.
                </p>
              </div>

              {/* Heartbeat URL Display */}
              <div>
                <label className="block text-[#6b6f76] text-[10px] tracking-[0.26em] uppercase mb-3 font-mono">
                  YOUR_HEARTBEAT_URL
                </label>
                
                <div className="bg-[#0b0c0e] border border-[#1f2227] p-4 space-y-3">
                  {/* URL Display */}
                  <div className="flex items-center gap-3">
                    <code className="flex-1 px-3 py-2 bg-[#15171a] border border-[#1f2227] text-[#f2d48a] text-[11px] font-mono break-all">
                      {heartbeatUrl}
                    </code>
                    
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="px-4 py-2 bg-[#f2d48a] text-[#0b0c0e] font-mono text-[10px] font-bold tracking-wider uppercase hover:bg-[#d6d7da] transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                      {copied ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          COPIED!
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          COPY
                        </>
                      )}
                    </button>
                  </div>

                  {/* Usage Instructions */}
                  <div className="pt-3 border-t border-[#1f2227]">
                    <p className="text-[#6b6f76] text-[9px] tracking-wider uppercase font-mono mb-2">
                      USAGE_EXAMPLE:
                    </p>
                    <div className="bg-[#15171a] border border-[#1f2227] p-3">
                      <code className="text-[#d6d7da] text-[10px] font-mono block">
                        #!/bin/bash<br />
                        <br />
                        # Your script logic<br />
                        python3 backup_database.py<br />
                        <br />
                        # Ping on success<br />
                        <span className="text-[#f2d48a]">curl {heartbeatUrl}</span>
                      </code>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="pt-3 border-t border-[#1f2227]">
                    <div className="space-y-2 text-[#6b6f76] text-[9px] font-mono leading-relaxed">
                      <p>• Add this curl command at the END of your script</p>
                      <p>• Only ping on SUCCESS (silence is the alarm!)</p>
                      <p>• Expected interval: <span className="text-[#f2d48a]">{intervalSeconds}s</span></p>
                      <p>• Grace period: <span className="text-[#f2d48a]">5 minutes</span></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleClose}
                className="w-full bg-[#f2d48a] text-[#0b0c0e] font-mono text-xs font-bold tracking-wider uppercase py-3 hover:bg-[#d6d7da] transition-all"
              >
                DONE
              </button>
            </div>
          ) : (
            <>
              {/* Regular Form Fields */}

          {/* Monitor Type */}
          <div>
            <label className="block text-[#6b6f76] text-[10px] tracking-[0.26em] uppercase mb-2 font-mono">
              MONITOR_TYPE
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(["simple", "scenario", "heartbeat"] as MonitorType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMonitorType(type)}
                  className={`px-4 py-3 border font-mono text-xs tracking-wider uppercase transition-all ${
                    monitorType === type
                      ? "bg-[#f2d48a]/10 border-[#f2d48a] text-[#f2d48a]"
                      : "bg-[#0b0c0e] border-[#1f2227] text-[#6b6f76] hover:border-[#2a2d31]"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Friendly Name */}
          <div>
            <label className="block text-[#6b6f76] text-[10px] tracking-[0.26em] uppercase mb-2 font-mono">
              FRIENDLY_NAME *
            </label>
            <input
              type="text"
              value={friendlyName}
              onChange={(e) => setFriendlyName(e.target.value)}
              required
              maxLength={50}
              className="w-full bg-[#0b0c0e] border border-[#1f2227] px-4 py-3 text-[#d6d7da] font-mono text-sm focus:outline-none focus:border-[#f2d48a] transition-colors"
              placeholder="My Production API"
            />
          </div>

          {/* URL (not for heartbeat) */}
          {monitorType !== "heartbeat" && (
            <div>
              <label className="block text-[#6b6f76] text-[10px] tracking-[0.26em] uppercase mb-2 font-mono">
                URL *
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="w-full bg-[#0b0c0e] border border-[#1f2227] px-4 py-3 text-[#d6d7da] font-mono text-sm focus:outline-none focus:border-[#f2d48a] transition-colors"
                placeholder="https://example.com"
              />
            </div>
          )}

          {/* Interval */}
          <div>
            <label className="block text-[#6b6f76] text-[10px] tracking-[0.26em] uppercase mb-2 font-mono">
              CHECK_INTERVAL (seconds) *
            </label>
            <input
              type="number"
              value={intervalSeconds}
              onChange={(e) => setIntervalSeconds(parseInt(e.target.value))}
              required
              min={monitorType === "heartbeat" ? 60 : 30}
              max={3600}
              className="w-full bg-[#0b0c0e] border border-[#1f2227] px-4 py-3 text-[#d6d7da] font-mono text-sm focus:outline-none focus:border-[#f2d48a] transition-colors"
            />
            <p className="mt-1 text-[#6b6f76] text-[9px] tracking-wider font-mono">
              MIN: {monitorType === "heartbeat" ? "60" : "30"}s | MAX: 3600s (1 hour)
            </p>
          </div>

          {/* Scenario Steps */}
          {monitorType === "scenario" && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-[#6b6f76] text-[10px] tracking-[0.26em] uppercase font-mono">
                  SCENARIO_STEPS (max 3)
                </label>
                {steps.length < 3 && (
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="text-[#f2d48a] text-[10px] tracking-wider uppercase font-mono hover:text-[#d6d7da] transition-colors"
                  >
                    + ADD_STEP
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div key={index} className="bg-[#0b0c0e] border border-[#1f2227] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[#f2d48a] text-[10px] tracking-wider uppercase font-mono">
                        STEP_{step.order}
                      </span>
                      {steps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(index)}
                          className="text-[#ff6a6a] text-[9px] tracking-wider uppercase font-mono hover:text-[#d6d7da]"
                        >
                          REMOVE
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={step.name}
                      onChange={(e) => handleStepChange(index, "name", e.target.value)}
                      placeholder="Step name"
                      required
                      maxLength={100}
                      className="w-full bg-[#15171a] border border-[#1f2227] px-3 py-2 text-[#d6d7da] font-mono text-xs focus:outline-none focus:border-[#f2d48a]"
                    />

                    <input
                      type="url"
                      value={step.url}
                      onChange={(e) => handleStepChange(index, "url", e.target.value)}
                      placeholder="https://example.com/step"
                      required
                      className="w-full bg-[#15171a] border border-[#1f2227] px-3 py-2 text-[#d6d7da] font-mono text-xs focus:outline-none focus:border-[#f2d48a]"
                    />

                    <input
                      type="text"
                      value={step.required_keyword || ""}
                      onChange={(e) => handleStepChange(index, "required_keyword", e.target.value)}
                      placeholder="Required keyword (optional)"
                      maxLength={200}
                      className="w-full bg-[#15171a] border border-[#1f2227] px-3 py-2 text-[#d6d7da] font-mono text-xs focus:outline-none focus:border-[#f2d48a]"
                    />
                    <p className="text-[#6b6f76] text-[8px] tracking-wider font-mono">
                      Keyword validation: case-insensitive search in response body
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-[#f2d48a]/5 border border-[#f2d48a]/20 px-4 py-3">
            <p className="text-[#f2d48a] text-[9px] tracking-wider font-mono leading-relaxed">
              {monitorType === "simple" && "SIMPLE: Monitors a single URL endpoint"}
              {monitorType === "scenario" && "SCENARIO: Multi-step monitoring with keyword validation"}
              {monitorType === "heartbeat" && "HEARTBEAT: Reverse-ping monitoring - expects inbound pings"}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-[#0b0c0e] border border-[#1f2227] text-[#6b6f76] font-mono text-xs tracking-wider uppercase py-3 hover:border-[#2a2d31] hover:text-[#d6d7da] transition-all"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#f2d48a] text-[#0b0c0e] font-mono text-xs font-bold tracking-wider uppercase py-3 hover:bg-[#d6d7da] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "CREATING..." : "CREATE_MONITOR"}
            </button>
          </div>
          </>
          )}
        </form>
      </div>
    </div>
  );
}
