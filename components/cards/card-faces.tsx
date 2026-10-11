import { BACK_CAPTION_Y, BACK_QR } from "@/lib/card-design";
import { cardColor } from "@/lib/card-palette";
import type { CardRecord } from "@/lib/cards";
import { qrModules } from "@/lib/qr-matrix";
import { tapUrl } from "@/lib/tap-url";

export type CardSide = "front" | "back";

const QUIET_ZONE = 4;

export function CardFront({ card }: { card: CardRecord }) {
  if (card.imageUrl) {
    return (
      // biome-ignore lint/performance/noImgElement: card art is a signed storage image
      <img
        src={card.imageUrl}
        alt={`Front of ${card.title}`}
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }
  return (
    <div
      className="absolute inset-0 flex flex-col justify-between p-4 text-white"
      style={{ background: cardColor(card.title) }}
    >
      <p className="text-sm text-white/70">NFC card</p>
      <p className="truncate text-2xl font-semibold tracking-tight">
        {card.title}
      </p>
    </div>
  );
}

export function CardBack({ card }: { card: CardRecord }) {
  if (card.backImageUrl) {
    return (
      // biome-ignore lint/performance/noImgElement: card art is a signed storage image
      <img
        src={card.backImageUrl}
        alt={`Back of ${card.title}`}
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }
  return (
    <>
      <div className="absolute inset-0 bg-[#111111]" />
      <QrMark url={tapUrl(card.publicId)} />
      <p
        className="absolute right-[8%] left-[8%] truncate text-center text-sm font-medium leading-5 text-[#F4F1EA]"
        style={{ top: `${BACK_CAPTION_Y * 100}%` }}
      >
        {card.title}
      </p>
    </>
  );
}

function QrMark({ url }: { url: string }) {
  const modules = qrModules(url);
  const cells = modules.length + QUIET_ZONE * 2;
  let path = "";
  modules.forEach((line, row) => {
    line.forEach((dark, col) => {
      if (dark) {
        path += `M${col + QUIET_ZONE} ${row + QUIET_ZONE}h1v1h-1z`;
      }
    });
  });
  return (
    <svg
      viewBox={`0 0 ${cells} ${cells}`}
      shapeRendering="crispEdges"
      className="absolute"
      style={{
        left: `${BACK_QR.x * 100}%`,
        top: `${BACK_QR.y * 100}%`,
        width: `${BACK_QR.w * 100}%`,
        height: `${BACK_QR.h * 100}%`,
      }}
      aria-hidden="true"
    >
      <rect width={cells} height={cells} fill="#FFFFFF" />
      <path d={path} fill="#111111" />
    </svg>
  );
}

export function FaceToggle({
  side,
  title,
  onChange,
}: {
  side: CardSide;
  title: string;
  onChange: (side: CardSide) => void;
}) {
  return (
    <fieldset className="m-0 flex shrink-0 rounded-full border-0 bg-black/[.04] p-0.5 dark:bg-white/[.06]">
      <legend className="sr-only">Side of {title}</legend>
      {(["front", "back"] as const).map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={side === value}
          onClick={() => onChange(value)}
          className="h-7 rounded-full px-3 text-xs font-medium text-zinc-500 capitalize transition-colors aria-pressed:bg-white aria-pressed:text-zinc-900 aria-pressed:shadow-sm dark:aria-pressed:bg-zinc-700 dark:aria-pressed:text-white"
        >
          {value}
        </button>
      ))}
    </fieldset>
  );
}
