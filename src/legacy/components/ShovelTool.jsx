function ShovelTool({ disabled, onClick }) {
  return (
    <button
      className={`shovel-tool ${disabled ? "disabled" : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label="Лопатка"
    >
      <img
        className="shovel-tool-image"
        src="/assets/tools/shovel-1.png"
        alt="Лопатка"
      />
    </button>
  );
}

export default ShovelTool;