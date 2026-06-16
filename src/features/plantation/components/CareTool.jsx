function CareTool({
  disabled,
  onClick,
  appliedCount = 0,
  wateredCount = 0,
  hasWateringCan = false,
}) {
  return (
    <button
      className={`care-tool ${disabled ? "disabled" : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label="Лейка, уход или удаление растения"
    >
      <span className="care-tool-icon">{hasWateringCan ? "💧" : "🧴"}</span>
      {(appliedCount > 0 || wateredCount > 0) && (
        <span className="care-tool-count">
          {wateredCount > 0 ? `${wateredCount}/2` : appliedCount}
        </span>
      )}
    </button>
  );
}

export default CareTool;
