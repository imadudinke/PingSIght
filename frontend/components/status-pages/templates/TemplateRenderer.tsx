"use client";

import { CorporateTemplate } from "./CorporateTemplate";
import { GamingTemplate } from "./GamingTemplate";
import { MinimalTemplate } from "./MinimalTemplate";
import { ModernTemplate } from "./ModernTemplate";


interface TemplateRendererProps {
  template: string;
  theme: string;
  layout: string;
  statusPage: any;
}

export function TemplateRenderer({ template, theme, layout, statusPage }: TemplateRendererProps) {
  const commonProps = { theme, layout, statusPage };

  switch (template) {
    case "minimal":
      return <MinimalTemplate {...commonProps} />;
    case "modern":
      return <ModernTemplate {...commonProps} />;
    case "corporate":
      return <CorporateTemplate {...commonProps} />;
    case "gaming":
      return <GamingTemplate {...commonProps} />;
    default:
      return <MinimalTemplate {...commonProps} />;
  }
}