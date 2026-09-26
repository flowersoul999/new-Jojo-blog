import type { ReactElement } from 'react'
import { Toaster } from "sonner";

// 百宝箱工具页的全局 toast 容器（sonner），挂在 TreasureLayout 里
export default function TreasureToaster(): ReactElement {
	return <Toaster position="top-center" richColors closeButton />;
}
