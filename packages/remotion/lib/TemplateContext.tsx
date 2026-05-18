import React from 'react';
import { TemplateProvider, type VisualTheme } from './visualTemplate';

export function VisualTemplateRoot({
  theme,
  children,
}: {
  theme: VisualTheme;
  children: React.ReactNode;
}) {
  return <TemplateProvider value={theme}>{children}</TemplateProvider>;
}
