/** Absolute path to the directory holding every installed icon file. */
export declare const svgDir: string;

/**
 * Every installed icon name, kebab-case and without the .svg extension.
 * Style variants appear as their own names: heart, heart-sharp, heart-solid.
 */
export declare function listIcons(): string[];

/** Absolute path to one icon file. Does not check that the file exists. */
export declare function getIconPath(name: string): string;

/** Source of one icon, or null when the icon is not installed. */
export declare function getIconSvg(name: string): string | null;
