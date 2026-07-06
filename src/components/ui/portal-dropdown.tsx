"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { createPortal } from "react-dom";

import { cn } from "@/utils";

type PortalDropdownProps = {
  align?: "end" | "start";
  contentClassName?: string;
  contentMinWidth?: number;
  children: ReactNode | ((props: { close: () => void }) => ReactNode);
  sideOffset?: number;
  trigger: (props: {
    "aria-controls": string;
    "aria-expanded": boolean;
    onClick: () => void;
    ref: React.RefObject<HTMLButtonElement | null>;
  }) => ReactNode;
  widthMatchTrigger?: boolean;
};

const VIEWPORT_PADDING = 12;
const HIDDEN_POSITION_STYLE: CSSProperties = {
  left: 0,
  position: "fixed",
  top: 0,
  visibility: "hidden",
  zIndex: 120,
};

export function PortalDropdown({
  align = "end",
  children,
  contentClassName,
  contentMinWidth,
  sideOffset = 8,
  trigger,
  widthMatchTrigger = false,
}: PortalDropdownProps) {
  const contentId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [positionStyle, setPositionStyle] = useState<CSSProperties>(
    HIDDEN_POSITION_STYLE,
  );
  const close = () => {
    setOpen(false);
  };

  const updatePosition = useMemo(
    () => () => {
      const triggerElement = triggerRef.current;
      const contentElement = contentRef.current;

      if (!triggerElement || !contentElement) {
        return;
      }

      const triggerRect = triggerElement.getBoundingClientRect();
      const contentRect = contentElement.getBoundingClientRect();
      const nextWidth = widthMatchTrigger
        ? Math.max(triggerRect.width, contentMinWidth ?? 0)
        : Math.max(contentRect.width, contentMinWidth ?? 0);
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const preferredLeft =
        align === "end"
          ? triggerRect.right - nextWidth
          : triggerRect.left;
      const maxLeft = viewportWidth - nextWidth - VIEWPORT_PADDING;
      const left = Math.max(VIEWPORT_PADDING, Math.min(preferredLeft, maxLeft));
      const spaceBelow = viewportHeight - triggerRect.bottom;
      const fitsBelow = spaceBelow >= contentRect.height + sideOffset + VIEWPORT_PADDING;
      const top = fitsBelow
        ? triggerRect.bottom + sideOffset
        : Math.max(
            VIEWPORT_PADDING,
            triggerRect.top - contentRect.height - sideOffset,
          );

      setPositionStyle({
        left,
        minWidth: contentMinWidth,
        position: "fixed",
        top,
        visibility: "visible",
        width: widthMatchTrigger ? triggerRect.width : undefined,
        zIndex: 120,
      });
    },
    [align, contentMinWidth, sideOffset, widthMatchTrigger],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const frame = window.requestAnimationFrame(updatePosition);
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (
        !triggerRef.current?.contains(target) &&
        !contentRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  return (
    <>
      {trigger({
        "aria-controls": contentId,
        "aria-expanded": open,
        onClick: () => {
          setOpen((current) => !current);
        },
        ref: triggerRef,
      })}
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className={cn(
                "overflow-hidden rounded-md border border-[color:var(--color-border)] bg-white p-1.5 shadow-[0_18px_36px_rgba(15,23,42,0.14)]",
                contentClassName,
              )}
              id={contentId}
              ref={contentRef}
              style={positionStyle}
            >
              {typeof children === "function" ? children({ close }) : children}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
