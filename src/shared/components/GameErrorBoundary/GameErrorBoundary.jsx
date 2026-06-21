import { Component } from "react";
import "./GameErrorBoundary.css";

export default class GameErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error("Grow App crashed:", error, info);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main className="game-error-screen">
        <section className="game-error-card">
          <span aria-hidden="true">!</span>
          <small>ИГРА ОСТАНОВИЛАСЬ</small>
          <h1>Нужен быстрый перезапуск</h1>
          <p>Прогресс сохранён на устройстве. Обнови игру и продолжай.</p>
          <button type="button" onClick={() => window.location.reload()}>
            Перезапустить
          </button>
        </section>
      </main>
    );
  }
}
