export interface NavItem {
  title: string;
  disabled?: boolean;
  icon?: string;
  svgIcon?: string;
  path?: string;
  children?: NavItem[];
}
