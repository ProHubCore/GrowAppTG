export const CLUB_BUYERS = [
  { id: "tipusian", name: "Типусиан", avatar: "◉", role: "Хозяин стола", prefers: "tabakko", tolerance: 0.72, patience: 2, opening: [0.82, 0.94], line: "Свежий товар вижу сразу. Назови цену без цирка." },
  { id: "margo", name: "Марго Ноль", avatar: "✦", role: "Бармен", prefers: "greenTomato", tolerance: 0.62, patience: 3, opening: [0.76, 0.9], line: "Кислоплод беру охотно, но переплачивать за название не стану." },
  { id: "rax", name: "Рэкс-12", avatar: "▣", role: "Курьер", prefers: "kokaNova", tolerance: 0.78, patience: 1, opening: [0.9, 1.03], line: "Мне надо быстро. Хорошая партия — хорошие деньги." },
  { id: "vespa", name: "Веспа", avatar: "◇", role: "Коллекционер", prefers: "kokaNova", tolerance: 0.86, patience: 2, opening: [0.84, 0.98], line: "Обычное качество не обсуждаю. За редкое могу забыть про бюджет." },
  { id: "uncle-bit", name: "Дядя Бит", avatar: "⌁", role: "Завсегдатай", prefers: "tabakko", tolerance: 0.55, patience: 4, opening: [0.68, 0.82], line: "Я беру много, поэтому и цена должна быть человеческая." },
  { id: "luna", name: "Луна-3", avatar: "☾", role: "Музыкант", prefers: "greenTomato", tolerance: 0.74, patience: 2, opening: [0.8, 0.96], line: "Мне нужен вкус, который не потеряется после третьего трека." },
  { id: "broker", name: "Серый Брокер", avatar: "△", role: "Перекупщик", prefers: null, tolerance: 0.46, patience: 3, opening: [0.62, 0.78], line: "Я заберу всё сейчас. Но маржу оставь мне." },
  { id: "oracle", name: "Оракул", avatar: "◎", role: "Редкий гость", prefers: null, tolerance: 0.9, patience: 1, opening: [0.95, 1.1], line: "Сегодня цена решается не рынком. Покажи лучшее." },
];

export function createClubLineup(count = 3) {
  const pool = [...CLUB_BUYERS].sort(() => Math.random() - 0.5).slice(0, count);
  return pool.map((buyer) => ({
    ...buyer,
    openingFactor: Number((buyer.opening[0] + Math.random() * (buyer.opening[1] - buyer.opening[0])).toFixed(2)),
    patienceLeft: buyer.patience,
    left: false,
  }));
}
