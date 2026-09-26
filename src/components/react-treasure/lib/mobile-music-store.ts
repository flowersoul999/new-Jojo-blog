import { useSyncExternalStore } from 'react'

// 迁移自旧博客的精简桩：Aemeath 暂无音乐播放器，收听历史恒为空
const snapshot: { history: Array<{ title: string; time: number }> } = { history: [] }
const subscribe = () => () => {}

export function useMobileMusicStore<T>(selector: (state: typeof snapshot) => T): T {
	return useSyncExternalStore(subscribe, () => selector(snapshot), () => selector(snapshot))
}
