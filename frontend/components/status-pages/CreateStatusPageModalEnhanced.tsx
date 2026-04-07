"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/ui";
import { useMonitors } from "@/lib/hooks/useMonitors";
import type { MonitorResponse } from "@/lib/api/types.gen";

interface CreateStatusPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Template {
  id: string;
  name: string;
  description: string;
  preview: string;
  features: string[];
}

const templates: Template[] = [
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean and simple design focused on essential information",
    preview: "🎯",
    features: ["Clean layout", "Fast loading", "Mobile optimized", "Essential info only"]
  },
  {
    id: "modern",
    name: "Modern",
    description: "Contemporary design with smooth animations and gradients",
    preview: "✨",
    features: ["Smooth animations", "Gradient backgrounds", "Interactive elements", "Modern typography"]
  },
  {
    id: "corporate",
    name: "Corporate",
    description: "Professional design suitable for enterprise environments",
    preview: "🏢",
    features: ["Professional look", "Detailed metrics", "Enterprise ready", "Custom branding"]
  },
  {
    id: "gaming",
    name: "Gaming",
    description: "Dark theme with neon accents perfect for gaming services",
    preview: "🎮",
    features: ["Dark theme", "Neon accents", "Gaming aesthetics", "High contrast"]
  }
];

export function CreateStatusPageModalEnhanced({ isOpen, onClose, onSuccess }: CreateStatusPageModalProps) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1); // 1: Template, 2: Details, 3: Monitors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [selectedTemplate, setSelectedTemplate] = useState("minimal");
  const [theme, setTheme] = useState("dark");
  const [layout, setLayout] = useState("list");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [showUptime, setShowUptime] = useState(true);
  const [showIncidentHistory, setShowIncidentHistory] = useState(true);
  const [primaryColor, setPrimaryColor] = useState("#10b981");
  const [selectedMonitors, setSelectedMonitors] = useState<string[]>([]);
  
  const { monitors } = useMonitors();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Auto-generate slug from name
  useEffect(() => {
    if (name) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setSlug(generatedSlug);
    }
  }, [name]);

  const handleSubmit = async () => {
    if (!name.trim() || !slug.trim()) {
      setError("Name and slug are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8000/api/status-pages", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          is_public: isPublic,
          show_uptime: showUptime,
          show_incident_history: showIncidentHistory,
          template: selectedTemplate,
          theme,
          layout,
          branding_primary_color: primaryColor,
          monitor_ids: selectedMonitors
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create status page");
      }

      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message || "Failed to create status page");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedTemplate("minimal");
    setTheme("dark");
    setLayout("list");
    setName("");
    setSlug("");
    setDescription("");
    setIsPublic(true);
    setShowUptime(true);
    setShowIncidentHistory(true);
    setPrimaryColor("#10b981");
    setSelectedMonitors([]);
    setError(null);
    onClose();
  };

  const toggleMonitor = (monitorId: string) => {
    setSelectedMonitors(prev => 
      prev.includes(monitorId) 
        ? prev.filter(id => id !== monitorId)
        : [...prev, monitorId]
    );
  };

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl max-h-[90vh] bg-[#0f1113] border border-[#1f2227] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#1f2227] flex items-center justify-between">
            <div>
              <div className="text-[#d6d7da] text-[14px] tracking-[0.18em] uppercase">
                CREATE_STATUS_PAGE
              </div>
              <div className="text-[#6f6f6f] text-[11px] tracking-[0.10em] mt-1">
                Step {step} of 3: {step === 1 ? "Choose Template" : step === 2 ? "Configure Details" : "Select Monitors"}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 grid place-items-center text-[#6f6f6f] hover:text-[#d6d7da] hover:bg-[rgba(255,255,255,0.05)] transition"
            >
              ×
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-2 bg-[#0a0b0c]">
            <div className="flex gap-2">
              {[1, 2, 3].map((stepNum) => (
                <div
                  key={stepNum}
                  className={cn(
                    "flex-1 h-1",
                    stepNum <= step ? "bg-[#f2d48a]" : "bg-[#2a2d31]"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {error && (
              <div className="mb-6 p-4 bg-[#ff6a6a]/10 border border-[#ff6a6a]/30 text-[#ff6a6a] text-[11px]">
                {error}
              </div>
            )}

            {/* Step 1: Template Selection */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <div className="text-[#d6d7da] text-[12px] tracking-[0.26em] uppercase mb-3">
                    Choose Template
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={cn(
                          "p-4 border cursor-pointer transition-all",
                          selectedTemplate === template.id
                            ? "border-[#f2d48a] bg-[#f2d48a]/5"
                            : "border-[#2a2d31] bg-[rgba(255,255,255,0.02)] hover:border-[#3a3d42]"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-[24px]">{template.preview}</div>
                          <div className="flex-1">
                            <div className="text-[#d6d7da] text-[12px] tracking-[0.16em] uppercase mb-1">
                              {template.name}
                            </div>
                            <div className="text-[#6f6f6f] text-[10px] leading-relaxed mb-3">
                              {template.description}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {template.features.map((feature) => (
                                <div
                                  key={feature}
                                  className="px-2 py-1 bg-[#2a2d31] text-[#a9acb2] text-[9px] tracking-wider uppercase"
                                >
                                  {feature}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Theme Selection */}
                  <div>
                    <div className="text-[#d6d7da] text-[12px] tracking-[0.26em] uppercase mb-3">
                      Theme
                    </div>
                    <div className="space-y-2">
                      {[
                        { id: "dark", name: "Dark", desc: "Dark background with light text" },
                        { id: "light", name: "Light", desc: "Light background with dark text" },
                        { id: "auto", name: "Auto", desc: "Follows system preference" }
                      ].map((themeOption) => (
                        <label
                          key={themeOption.id}
                          className="flex items-center gap-3 p-3 border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] hover:border-[#3a3d42] cursor-pointer transition"
                        >
                          <input
                            type="radio"
                            name="theme"
                            value={themeOption.id}
                            checked={theme === themeOption.id}
                            onChange={(e) => setTheme(e.target.value)}
                            className="sr-only"
                          />
                          <div className={cn(
                            "w-4 h-4 border-2 rounded-full",
                            theme === themeOption.id ? "border-[#f2d48a] bg-[#f2d48a]" : "border-[#2a2d31]"
                          )} />
                          <div>
                            <div className="text-[#d6d7da] text-[11px] tracking-[0.16em] uppercase">
                              {themeOption.name}
                            </div>
                            <div className="text-[#6f6f6f] text-[10px]">
                              {themeOption.desc}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Layout Selection */}
                  <div>
                    <div className="text-[#d6d7da] text-[12px] tracking-[0.26em] uppercase mb-3">
                      Layout
                    </div>
                    <div className="space-y-2">
                      {[
                        { id: "list", name: "List", desc: "Vertical list of components" },
                        { id: "grid", name: "Grid", desc: "Grid layout for components" },
                        { id: "compact", name: "Compact", desc: "Dense information display" }
                      ].map((layoutOption) => (
                        <label
                          key={layoutOption.id}
                          className="flex items-center gap-3 p-3 border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] hover:border-[#3a3d42] cursor-pointer transition"
                        >
                          <input
                            type="radio"
                            name="layout"
                            value={layoutOption.id}
                            checked={layout === layoutOption.id}
                            onChange={(e) => setLayout(e.target.value)}
                            className="sr-only"
                          />
                          <div className={cn(
                            "w-4 h-4 border-2 rounded-full",
                            layout === layoutOption.id ? "border-[#f2d48a] bg-[#f2d48a]" : "border-[#2a2d31]"
                          )} />
                          <div>
                            <div className="text-[#d6d7da] text-[11px] tracking-[0.16em] uppercase">
                              {layoutOption.name}
                            </div>
                            <div className="text-[#6f6f6f] text-[10px]">
                              {layoutOption.desc}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[#d6d7da] text-[11px] tracking-[0.26em] uppercase mb-2">
                      Status Page Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="My Service Status"
                      className="w-full h-[38px] px-3 bg-[rgba(0,0,0,0.28)] border border-[#2a2d31] text-[#d6d7da] text-[11px] tracking-[0.12em] placeholder:text-[#60646b] focus:outline-none focus:border-[#b9c7ff]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#d6d7da] text-[11px] tracking-[0.26em] uppercase mb-2">
                      URL Slug *
                    </label>
                    <div className="flex">
                      <div className="px-3 h-[38px] bg-[#2a2d31] border border-r-0 border-[#2a2d31] text-[#6f6f6f] text-[11px] flex items-center">
                        /status/
                      </div>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="my-service"
                        className="flex-1 h-[38px] px-3 bg-[rgba(0,0,0,0.28)] border border-[#2a2d31] text-[#d6d7da] text-[11px] tracking-[0.12em] placeholder:text-[#60646b] focus:outline-none focus:border-[#b9c7ff]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[#d6d7da] text-[11px] tracking-[0.26em] uppercase mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of your service status page"
                    rows={3}
                    className="w-full px-3 py-2 bg-[rgba(0,0,0,0.28)] border border-[#2a2d31] text-[#d6d7da] text-[11px] tracking-[0.12em] placeholder:text-[#60646b] focus:outline-none focus:border-[#b9c7ff] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[#d6d7da] text-[11px] tracking-[0.26em] uppercase mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-[38px] border border-[#2a2d31] bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#10b981"
                      className="flex-1 h-[38px] px-3 bg-[rgba(0,0,0,0.28)] border border-[#2a2d31] text-[#d6d7da] text-[11px] tracking-[0.12em] placeholder:text-[#60646b] focus:outline-none focus:border-[#b9c7ff]"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-[#d6d7da] text-[11px] tracking-[0.26em] uppercase">
                    Display Options
                  </div>
                  
                  {[
                    { key: "isPublic", label: "Public Status Page", desc: "Allow public access without authentication", value: isPublic, setter: setIsPublic },
                    { key: "showUptime", label: "Show Uptime Statistics", desc: "Display uptime percentages for components", value: showUptime, setter: setShowUptime },
                    { key: "showIncidentHistory", label: "Show Incident History", desc: "Display past incidents and updates", value: showIncidentHistory, setter: setShowIncidentHistory }
                  ].map((option) => (
                    <label key={option.key} className="flex items-center justify-between gap-4 p-3 border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] cursor-pointer">
                      <div>
                        <div className="text-[#d6d7da] text-[11px] tracking-[0.16em] uppercase">
                          {option.label}
                        </div>
                        <div className="text-[#6f6f6f] text-[10px] mt-1">
                          {option.desc}
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={option.value}
                          onChange={(e) => option.setter(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={cn(
                          "w-11 h-6 rounded-full transition-all duration-200",
                          option.value ? "bg-[#f2d48a]" : "bg-[#2a2d31]"
                        )}>
                          <div className={cn(
                            "absolute top-0.5 w-5 h-5 bg-[#d6d7da] rounded-full transition-all duration-200 shadow-md",
                            option.value ? "translate-x-5" : "translate-x-0.5"
                          )} />
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Monitor Selection */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <div className="text-[#d6d7da] text-[12px] tracking-[0.26em] uppercase mb-3">
                    Select Monitors to Include
                  </div>
                  <div className="text-[#6f6f6f] text-[10px] leading-relaxed mb-4">
                    Choose which monitors should be displayed on this status page. You can organize them into components later.
                  </div>
                  
                  {monitors.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-[#6f6f6f] text-[11px] tracking-[0.26em] uppercase mb-2">
                        No Monitors Found
                      </div>
                      <div className="text-[#5f636a] text-[10px]">
                        Create some monitors first to include them in your status page.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {monitors.map((monitor) => (
                        <label
                          key={monitor.id}
                          className="flex items-center gap-3 p-3 border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] hover:border-[#3a3d42] cursor-pointer transition"
                        >
                          <input
                            type="checkbox"
                            checked={selectedMonitors.includes(monitor.id)}
                            onChange={() => toggleMonitor(monitor.id)}
                            className="sr-only"
                          />
                          <div className={cn(
                            "w-4 h-4 border-2",
                            selectedMonitors.includes(monitor.id) 
                              ? "border-[#f2d48a] bg-[#f2d48a]" 
                              : "border-[#2a2d31]"
                          )}>
                            {selectedMonitors.includes(monitor.id) && (
                              <svg className="w-full h-full text-[#0b0c0e]" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="text-[#d6d7da] text-[11px] tracking-[0.16em] uppercase">
                                {monitor.friendly_name}
                              </div>
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                monitor.status === "UP" ? "bg-[#10b981]" : 
                                monitor.status === "DOWN" ? "bg-[#ff6a6a]" : "bg-[#f2d48a]"
                              )} />
                            </div>
                            <div className="text-[#6f6f6f] text-[10px] mt-1">
                              {monitor.url} • {monitor.monitor_type?.toUpperCase()}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-4 p-3 bg-[#f2d48a]/10 border border-[#f2d48a]/30">
                    <div className="text-[#f2d48a] text-[10px] tracking-[0.26em] uppercase mb-1">
                      Selected: {selectedMonitors.length} monitors
                    </div>
                    <div className="text-[#d6d7da] text-[10px]">
                      You can add or remove monitors later from the status page settings.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#1f2227] flex items-center justify-between">
            <div className="flex gap-3">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  disabled={loading}
                  className="h-10 px-4 border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] text-[#a9acb2] hover:text-[#d6d7da] hover:border-[#3a3d42] transition text-[10px] tracking-[0.26em] uppercase disabled:opacity-50"
                >
                  Previous
                </button>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={loading}
                className="h-10 px-4 border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] text-[#a9acb2] hover:text-[#d6d7da] hover:border-[#3a3d42] transition text-[10px] tracking-[0.26em] uppercase disabled:opacity-50"
              >
                Cancel
              </button>
              
              {step < 3 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={loading}
                  className="h-10 px-6 bg-[#f2d48a] text-[#0b0c0e] font-mono text-[10px] font-bold tracking-wider uppercase hover:bg-[#d6d7da] transition-all disabled:opacity-50"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading || !name.trim() || !slug.trim()}
                  className="h-10 px-6 bg-[#f2d48a] text-[#0b0c0e] font-mono text-[10px] font-bold tracking-wider uppercase hover:bg-[#d6d7da] transition-all disabled:opacity-50"
                >
                  {loading ? "CREATING..." : "CREATE_STATUS_PAGE"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}