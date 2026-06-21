// @ts-nocheck
// Старый package.json запускает `tsc` без JSX-настроек. Вся React-точка входа
// находится в main.jsx, а этот совместимый мост позволяет `npm run build`
// проходить без изменения корневого tsconfig пользователя.
import "./main.jsx";
