import "./TestResetButton.css";

function TestResetButton({ onClick }) {
  return (
    <button
      className="test-reset-button"
      type="button"
      onClick={onClick}
    >
      Сбросить всё
    </button>
  );
}

export default TestResetButton;
