"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  animate,
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "framer-motion";

/** Idle spin in degrees per second; a full turn takes 45 seconds. */
const SPIN_SPEED = 8;
/** Share of fling velocity kept per 60fps frame after the pointer lets go. */
const FRICTION = 0.95;
/** Pointer travel in px before a press becomes a drag instead of a click. */
const DRAG_THRESHOLD = 6;
/** Camera height above the ring in px, so the far side of the ring shows above the near side. */
const EYE_HEIGHT = 220;
/** Room above and below the ring for card shadows. */
const PADDING = 24;

export interface CarouselItem {
  key: string;
  /** Shown while the card faces the viewer. Put the interactive element here. */
  front: ReactNode;
  /** Shown while the card faces away from the viewer. */
  back?: ReactNode;
}

interface ThreeDCarouselProps {
  items: CarouselItem[];
  cardWidth: number;
  cardHeight: number;
  /** Space between neighbouring cards at the front of the ring. */
  gap?: number;
}

const hidden = { backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" } as const;

function Face({
  item,
  angle,
  radius,
  rotation,
  onFocus,
}: {
  item: CarouselItem;
  angle: number;
  radius: number;
  rotation: MotionValue<number>;
  onFocus: () => void;
}) {
  // 1 when the card points straight at the viewer, -1 when it points straight away.
  const facing = useTransform(rotation, (r) => Math.cos(((angle + r) * Math.PI) / 180));
  const frontOpacity = useTransform(facing, [0, 0.5, 1], [0.25, 0.8, 1]);
  const backOpacity = useTransform(facing, [-1, 0], [0.9, 0.35]);
  const pointerEvents = useTransform(facing, (c) => (c > 0.25 ? "auto" : "none"));

  return (
    <div
      className="absolute inset-0"
      style={{ transform: `rotateY(${angle}deg) translateZ(${radius}px)`, transformStyle: "preserve-3d" }}
      onFocus={(e) => {
        if (e.target.matches(":focus-visible")) onFocus();
      }}
    >
      <motion.div className="absolute inset-0" style={{ ...hidden, opacity: frontOpacity, pointerEvents }}>
        {item.front}
      </motion.div>
      {item.back && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ ...hidden, transform: "rotateY(180deg)", opacity: backOpacity }}
        >
          {item.back}
        </motion.div>
      )}
    </div>
  );
}

/**
 * A ring of cards that slowly spins. Drag or swipe to turn it, hover to pause,
 * and tab through the cards to bring each one to the front.
 */
export function ThreeDCarousel({ items, cardWidth, cardHeight, gap = 24 }: ThreeDCarouselProps) {
  const reduceMotion = useReducedMotion();
  const rotation = useMotionValue(0);
  const velocity = useRef(0);
  const drag = useRef<{ id: number; startX: number; lastX: number; lastT: number; moved: boolean } | null>(null);
  const swallowClick = useRef(false);
  const spin = useRef<ReturnType<typeof animate> | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const count = Math.max(items.length, 1);
  const step = 360 / count;
  // Space the cards so neighbours never overlap, with a floor so short lists still read as a ring.
  const radius = Math.max((cardWidth + gap) / 2 / Math.tan(Math.PI / count), cardWidth * 1.1);
  const perspective = Math.max(radius * 2.6, 1200);
  const degreesPerPx = 180 / (Math.PI * radius);
  // Seen from above, the far side of the ring pokes out over the front card; leave room for it.
  const farScale = perspective / (perspective + 2 * radius);
  const farCenter = EYE_HEIGHT * (1 - farScale);
  const headroom = Math.max(0, farCenter + (farScale * cardHeight) / 2 - cardHeight / 2);
  const ringCenter = PADDING + headroom + cardHeight / 2;

  const transform = useTransform(rotation, (r) => `translateZ(${-radius}px) rotateY(${r}deg)`);

  useAnimationFrame((_, delta) => {
    if (drag.current?.moved) return;
    const dt = Math.min(delta, 50);
    if (velocity.current !== 0) {
      rotation.set(rotation.get() + velocity.current * dt);
      velocity.current *= Math.pow(FRICTION, dt / 16.7);
      if (Math.abs(velocity.current) < 0.002) velocity.current = 0;
      return;
    }
    if (!reduceMotion && !hovered && !focused) {
      rotation.set(rotation.get() - (SPIN_SPEED * dt) / 1000);
    }
  });

  const bringToFront = (index: number) => {
    velocity.current = 0;
    const current = rotation.get();
    // Turn the short way round to the card's front-facing angle.
    const delta = ((((-index * step - current) % 360) + 540) % 360) - 180;
    spin.current?.stop();
    if (reduceMotion) rotation.set(current + delta);
    else spin.current = animate(rotation, current + delta, { type: "spring", stiffness: 140, damping: 24 });
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state || state.id !== e.pointerId) return;
    drag.current = null;
    swallowClick.current = state.moved;
    // A pointer that stopped before letting go should not fling the ring.
    if (e.timeStamp - state.lastT > 80) velocity.current = 0;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div
      className="relative w-full cursor-grab select-none active:cursor-grabbing"
      style={{
        height: cardHeight + headroom + 2 * PADDING,
        perspective,
        perspectiveOrigin: `50% ${ringCenter - EYE_HEIGHT}px`,
        touchAction: "pan-y",
      }}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        swallowClick.current = false;
        velocity.current = 0;
        spin.current?.stop();
        drag.current = { id: e.pointerId, startX: e.clientX, lastX: e.clientX, lastT: e.timeStamp, moved: false };
      }}
      onPointerMove={(e) => {
        const state = drag.current;
        if (!state || state.id !== e.pointerId) return;
        if (!state.moved) {
          if (Math.abs(e.clientX - state.startX) < DRAG_THRESHOLD) return;
          state.moved = true;
          e.currentTarget.setPointerCapture(e.pointerId);
        }
        const turn = (e.clientX - state.lastX) * degreesPerPx;
        rotation.set(rotation.get() + turn);
        velocity.current = Math.max(-1.5, Math.min(1.5, turn / Math.max(e.timeStamp - state.lastT, 1)));
        state.lastX = e.clientX;
        state.lastT = e.timeStamp;
      }}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={(e) => {
        // The click that ends a drag should not open the card under the pointer.
        if (!swallowClick.current) return;
        swallowClick.current = false;
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <motion.div
        className="absolute"
        style={{
          width: cardWidth,
          height: cardHeight,
          left: `calc(50% - ${cardWidth / 2}px)`,
          top: PADDING + headroom,
          transformStyle: "preserve-3d",
          transform,
        }}
      >
        {items.map((item, i) => (
          <Face
            key={item.key}
            item={item}
            angle={i * step}
            radius={radius}
            rotation={rotation}
            onFocus={() => bringToFront(i)}
          />
        ))}
      </motion.div>
    </div>
  );
}
