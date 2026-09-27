import { useSyncExternalStore } from "react";

// 精简桩：收听历史由站点音乐播放器在浏览器侧维护，这里恒为空，
// 保证百宝箱「正在播放」类工具（now）能正常渲染
const snapshot: { history: Array<{ title: string; time: number }> } = {
	history: [],
};
const subscribe = () => () => {};

export function useMobileMusicStore<T>(
	selector: (state: typeof snapshot) => T,
): T {
	return useSyncExternalStore(
		subscribe,
		() => selector(snapshot),
		() => selector(snapshot),
	);
}
