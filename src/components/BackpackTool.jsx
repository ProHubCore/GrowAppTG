function BackpackTool({ onClick }) {
  return (
    <button
      className="backpack-tool"
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