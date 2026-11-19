import {
  SwimmingPool, Tree, SoccerBall, PingPong, Fire, ForkKnife, CookingPot, Campfire, Car, PawPrint, WifiHigh, Coffee,
  MapPin, Bed, Bathtub, Users, Star, ShareNetwork, CaretLeft, CaretRight, Check, X, CalendarBlank, Minus, Plus,
  ShieldCheck, ChatCircleText, CalendarCheck, Mountains, Lock, CreditCard, SignOut, User, Envelope, Phone, Clock,
  ArrowRight, ArrowLeft, Door, SquaresFour, ListBullets, House, Gear, Bell, CurrencyEur, Wallet, ArrowsClockwise,
  Trash, Warning, Info, Plug, ChartLineUp, Receipt, CaretDown, GridFour, ImagesSquare, Heart, Sun, Tag, SealPercent, Sparkle, Copy, PencilSimple, List, Leaf, Quotes,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

const map = {
  pool: SwimmingPool, tree: Tree, ball: SoccerBall, pingpong: PingPong, fire: Fire, dining: ForkKnife,
  cooking: CookingPot, wood: Campfire, car: Car, paw: PawPrint, wifi: WifiHigh, coffee: Coffee,
  pin: MapPin, bed: Bed, bath: Bathtub, users: Users, star: Star, share: ShareNetwork, left: CaretLeft,
  right: CaretRight, check: Check, x: X, calendar: CalendarBlank, minus: Minus, plus: Plus, shield: ShieldCheck,
  chat: ChatCircleText, calcheck: CalendarCheck, mountains: Mountains, lock: Lock, card: CreditCard,
  signout: SignOut, user: User, mail: Envelope, phone: Phone, clock: Clock, arrow: ArrowRight, back: ArrowLeft,
  door: Door, dash: SquaresFour, list: ListBullets, house: House, gear: Gear, bell: Bell, euro: CurrencyEur,
  wallet: Wallet, sync: ArrowsClockwise, trash: Trash, warn: Warning, info: Info, plug: Plug, chart: ChartLineUp,
  receipt: Receipt, down: CaretDown, grid: GridFour, photos: ImagesSquare, heart: Heart, sun: Sun, tag: Tag, percent: SealPercent, sparkle: Sparkle, copy: Copy, edit: PencilSimple, menu: List, leaf: Leaf, quote: Quotes,
} as const;

export type IconName = keyof typeof map;

export function Icon({
  name, size = 22, weight = "regular", className, label,
}: {
  name: string; size?: number; weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone"; className?: string; label?: string;
}) {
  const C = (map as Record<string, PhosphorIcon>)[name] ?? Info;
  return <C size={size} weight={weight} className={className} aria-hidden={label ? undefined : true} aria-label={label} />;
}
