import { PlayIcon, PlayersIcon, TrophyIcon, SettingsIcon } from "./icons";

export type NavItem = {
  href: string;
  label: string;
  Icon: (props: React.SVGProps<SVGSVGElement> & { size?: number }) => JSX.Element;
};

/** Primary navigation — shared by the mobile TabBar and the desktop SideNav. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/play", label: "Play", Icon: PlayIcon },
  { href: "/players", label: "Players", Icon: PlayersIcon },
  { href: "/leaderboard", label: "Ranks", Icon: TrophyIcon },
  { href: "/settings", label: "Settings", Icon: SettingsIcon },
];
