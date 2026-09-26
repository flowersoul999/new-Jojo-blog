import type { ReactElement } from 'react'
import type { AnchorHTMLAttributes, ReactNode } from "react";

// next/link 的轻量替代：Astro 多页应用直接走原生跳转
// 只转发 href 与常规 a 属性，next 专有的 prefetch 等属性被静默忽略
interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
	href: string;
	children: ReactNode;
}

export default function Link({ href, children, ...rest }: LinkProps): ReactElement {
	return (
		<a href={href} {...rest}>
			{children}
		</a>
	);
}
