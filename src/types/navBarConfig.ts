export type NavBarLink = {
	name: string;
	url: string;
	external?: boolean;
	icon?: string; // 菜单项图标
	iconImage?: string; // 外部链接使用的图片图标
	children?: NavBarLink[]; // 支持子菜单
	pageKey?: string;
	activePaths?: string[]; // 附加高亮路径（如日志页含画布 /diary/）
};

export enum NavBarSearchMethod {
	PageFind = 0,
}

export type NavBarSearchConfig = {
	method: NavBarSearchMethod;
};

export type NavBarConfig = {
	links: NavBarLink[];
};
