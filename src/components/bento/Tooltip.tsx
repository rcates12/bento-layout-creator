"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import { Transition } from "@headlessui/react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  side?: "top" | "bottom" | "left" | "right"
  className?: string
}

const DELAY_MS = 400
const GAP_PX = 6

export function Tooltip({
  content,
  children,
  side = "top",
  className = "",
}: TooltipProps) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLSpanElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const computeCoords = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    let top = 0
    let left = 0
    switch (side) {
      case "top":
        top = rect.top - GAP_PX
        left = rect.left + rect.width / 2
        break
      case "bottom":
        top = rect.bottom + GAP_PX
        left = rect.left + rect.width / 2
        break
      case "left":
        top = rect.top + rect.height / 2
        left = rect.left - GAP_PX
        break
      case "right":
        top = rect.top + rect.height / 2
        left = rect.right + GAP_PX
        break
    }
    setCoords({ top, left })
  }, [side])

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => {
      computeCoords()
      setOpen(true)
    }, DELAY_MS)
  }, [computeCoords])

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setOpen(false)
  }, [])

  const transformMap: Record<string, string> = {
    top: "translate(-50%, -100%)",
    bottom: "translate(-50%, 0)",
    left: "translate(-100%, -50%)",
    right: "translate(0, -50%)",
  }

  return (
    <>
      <span
        ref={triggerRef}
        className={cn("inline-flex", className)}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>
      {mounted &&
        createPortal(
          <Transition show={open}>
            <div
              style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                transform: transformMap[side],
                zIndex: 9999,
                pointerEvents: "none",
              }}
              className={cn(
                "z-50 inline-flex w-fit max-w-xs items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background",
                "transition duration-100 ease-out",
                "data-[closed]:opacity-0 data-[closed]:scale-95"
              )}
            >
              {content}
            </div>
          </Transition>,
          document.body
        )}
    </>
  )
}
