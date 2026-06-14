function CareTool({ disabled, onClick, appliedCount = 0 }) {
  return (
    <button
      className={`care-tool ${disabled ? "disabled" : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label="Уход или удаление растения"
    >
      <span className="care-tool-icon">🧴</span>
      {appliedCount > 0 && <span className="care-tool-count">{appliedCount}/3</span>}
    </button>
  );
}

export default CareTool;
