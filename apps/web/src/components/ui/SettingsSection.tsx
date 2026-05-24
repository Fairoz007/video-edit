import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface SettingsSectionProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}

export function SettingsSection({ title, icon: Icon, children, className = '' }: SettingsSectionProps) {
  return (
    <section className={`settings-section ${className}`}>
      <h3 className="settings-section-title">
        <span className="settings-section-icon">
          <Icon className="w-3.5 h-3.5" />
        </span>
        {title}
      </h3>
      <div className="settings-section-body">{children}</div>
    </section>
  );
}

export function SettingsField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="settings-field">
      <label className="settings-label">{label}</label>
      {children}
      {hint ? <p className="settings-hint">{hint}</p> : null}
    </div>
  );
}
