interface SectionTitleProps {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center' | 'right';
}

export default function SectionTitle({ title, subtitle, align = 'left' }: SectionTitleProps) {
  const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
  return (
    <div className={`mb-6 ${alignClass}`}>
      <h2 className="font-vintage-title text-3xl" style={{ color: '#8B6F47' }}>{title}</h2>
      {subtitle && (
        <p className="font-vintage-body mt-1" style={{ color: '#6B4C57' }}>{subtitle}</p>
      )}
    </div>
  );
}
