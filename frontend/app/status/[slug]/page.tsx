"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BackgroundLayers } from "@/components/dashboard/BackgroundLayers";
import { Panel } from "@/components/dashboard/Panel";

// Local import to keep this file self-contained in your snippet context.
// In your repo, keep using: import { TemplateRenderer } from "@/components/status-pages/templates/TemplateRenderer";
import { TemplateRenderer } from "@/components/status-pages/templates/TemplateRenderer";
import { getApiBaseUrl } from "@/lib/constants";

type PublicStatus = {
  name: string;
  description?: string | null;
  slug: string;
  show_uptime: boolean;
  show_incident_history: boolean;
  template: string;
  theme: string;
  layout: string;
  branding_logo_url?: string | null;
  branding_primary_color?: string | null;
  branding_custom_css?: string | null;
  overall_status: string;
  active_incidents?: any[];
  upcoming_maintenances?: any[];
  components?: any[];
};

export default function PublicStatusPage() {
  const params = useParams();
  const slug = (params as any)?.slug as string | undefined;

  const [statusPage, setStatusPage] = useState<PublicStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchStatusPage = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${getApiBaseUrl()}/api/status-pages/public/${slug}`
        );

        if (!response.ok) throw new Error("STATUS_PAGE_NOT_FOUND");

        const data = await response.json();
        setStatusPage(data);
      } catch (err: any) {
        setError(err.message || "STATUS_PAGE_NOT_FOUND");
      } finally {
        setLoading(false);
      }
    };

    fetchStatusPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0c0e] flex items-center justify-center">
        <div className="font-mono text-[#6b6f76] tracking-[0.28em] animate-pulse text-[11px] uppercase">
          LOADING_STATUS...
        </div>
      </div>
    );
  }

  if (error || !statusPage) {
    return (
      <div className="min-h-screen bg-[#0b0c0e] flex items-center justify-center px-6">
        <Panel className="p-0 w-full max-w-[560px] overflow-hidden">
          <div className="h-[3px] bg-[#ff6a6a]" />
          <div className="px-6 py-6">
            <div className="text-[#ff6a6a] tracking-[0.28em] text-[11px] uppercase mb-2">
              STATUS_PAGE_NOT_FOUND
            </div>
            <div className="text-[#6f6f6f] text-[11px] leading-relaxed">
              {error || "THE_REQUESTED_STATUS_PAGE_DOES_NOT_EXIST"}
            </div>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <>
      {/* Custom CSS */}
      {statusPage.branding_custom_css && (
        <style
          dangerouslySetInnerHTML={{ __html: statusPage.branding_custom_css }}
        />
      )}

      {/* IMPORTANT: we do not change template logic/data; only visual framing matches your system */}
      <div className="min-h-screen text-[#b0b3b8] font-mono">
        <BackgroundLayers />

        <div className="max-w-6xl mx-auto px-6 py-10">
          {/* “System shell” header plate to match Observatory concept */}
          <Panel className="p-0 overflow-hidden mb-6">
            <div className="px-6 py-5 border-b border-[#15171a] flex items-start justify-between gap-6">
              <div>
                <div className="text-[#d6d7da] text-[14px] tracking-[0.18em] uppercase">
                  STATUS_PAGE
                </div>
                <div className="mt-1 text-[#6f6f6f] text-[11px] tracking-[0.10em]">
                  PUBLIC_ENDPOINT / SLUG: {statusPage.slug}
                </div>
              </div>

              <div className="text-right">
                <div className="text-[#5f636a] text-[10px] tracking-[0.26em] uppercase">
                  TEMPLATE
                </div>
                <div className="mt-1 text-[#d6d7da] text-[11px] tracking-[0.18em] uppercase">
                  {statusPage.template} / {statusPage.theme} / {statusPage.layout}
                </div>
              </div>
            </div>
          </Panel>

          {/* The actual template output (unchanged) */}
          <TemplateRenderer
            template={statusPage.template}
            theme={statusPage.theme}
            layout={statusPage.layout}
            statusPage={statusPage}
          />
        </div>
      </div>
    </>
  );
}
