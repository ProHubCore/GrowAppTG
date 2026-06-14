function BackpackTool({ onClick, disabled = false }) {
  return (
    <button
      className="backpack-tool"
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label="Инвентарь"
    >
      <img
        className="backpack-tool-image"
        src="/assets/items/backpack-1.png"
        alt="Рюкзак"
      />
    </button>
  );
}

export default BackpackTool;
