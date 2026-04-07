interface StatusPageCardProps {
  statusPage: any;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}

export function StatusPageCard({ statusPage, onEdit, onDelete, onView }: StatusPageCardProps) {
  const publicUrl = `${window.location.origin}/status/${statusPage.slug}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    // Could add toast notification here
  };

  return (
    <div className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] p-5 hover:border-[#3a3d42] transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-[#d6d7da] text-[13px] tracking-[0.16em] uppercase mb-1">
            {statusPage.name}
          </h3>
          {statusPage.description && (
            <p className="text-[#6f6f6f] text-[10px] leading-relaxed">
              {statusPage.description}
            </p>
          )}
        </div>

        {statusPage.is_public && (
          <div className="ml-3 px-2 py-1 bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981] text-[9px] tracking-wider uppercase">
            PUBLIC
          </div>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-[#5f636a] tracking-[0.22em] uppercase">SLUG:</span>
          <span className="text-[#d6d7da] font-mono">{statusPage.slug}</span>
        </div>

        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-[#5f636a] tracking-[0.22em] uppercase">URL:</span>
          <button
            onClick={copyUrl}
            className="text-[#f2d48a] hover:text-[#d6d7da] transition-colors font-mono text-[9px] flex items-center gap-1"
            title="Click to copy"
          >
            <span className="truncate max-w-[200px]">{publicUrl}</span>
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onView}
          className="flex-1 h-9 border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] text-[#a9acb2] hover:text-[#d6d7da] hover:border-[#3a3d42] transition text-[10px] tracking-[0.26em] uppercase"
        >
          VIEW
        </button>

        <button
          onClick={onEdit}
          className="flex-1 h-9 border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] text-[#a9acb2] hover:text-[#d6d7da] hover:border-[#3a3d42] transition text-[10px] tracking-[0.26em] uppercase"
        >
          EDIT
        </button>

        <button
          onClick={onDelete}
          className="h-9 px-4 border border-[#ff6a6a]/30 bg-[#ff6a6a]/5 text-[#ff6a6a] hover:bg-[#ff6a6a]/10 transition text-[10px] tracking-[0.26em] uppercase"
        >
          DELETE
        </button>
      </div>
    </div>
  );
}
