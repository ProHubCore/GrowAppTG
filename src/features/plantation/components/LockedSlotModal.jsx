import "./LockedSlotModal.css";

export default function LockedSlotModal({ isOpen, title="Место закрыто", statusText="Сначала выполни поручение Марии", requirementText="Вернись в дом Марии Ивановны и продолжи её цепочку поручений.", onClose }) {
  if (!isOpen) return null;
  return (
    <div className="locked-slot-overlay" onPointerDown={(event)=>{ if(event.target===event.currentTarget) onClose(); }}>
      <section className="locked-slot-modal" role="dialog" aria-modal="true" aria-labelledby="locked-slot-title">
        <header className="locked-slot-header">
          <span className="locked-slot-handle" aria-hidden="true" />
          <div><span>ПЛАНТАЦИЯ МАРИИ</span><h2 id="locked-slot-title">{title}</h2></div>
          <button type="button" className="locked-slot-close" onClick={onClose} aria-label="Закрыть окно">×</button>
        </header>
        <div className="locked-slot-tray">
          <div className="locked-slot-emblem" aria-hidden="true"><span className="locked-slot-shackle"/><span className="locked-slot-lock"><i /></span></div>
          <div className="locked-slot-copy"><strong>{statusText}</strong><p>{requirementText}</p></div>
        </div>
        <div className="locked-slot-maria-note"><span>М</span><p>«Ведро не покупают раньше, чем научились работать с тем, что уже есть».</p></div>
        <button type="button" className="locked-slot-confirm" onClick={onClose}>Понятно</button>
      </section>
    </div>
  );
}
