"use client"

import * as React from "react"
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/react"
import { ChevronDownIcon, CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// Context to share value state so SelectValue can display the correct label
type SelectContextValue = {
  value: string
  labelMap: Map<string, React.ReactNode>
  registerLabel: (val: string, label: React.ReactNode) => void
  onValueChange?: (value: string) => void
}

const SelectContext = React.createContext<SelectContextValue>({
  value: "",
  labelMap: new Map(),
  registerLabel: () => {},
  onValueChange: undefined,
})

function Select({
  value = "",
  onValueChange,
  children,
  defaultValue,
  ...props
}: {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
} & Record<string, unknown>) {
  const [labelMap, setLabelMap] = React.useState<Map<string, React.ReactNode>>(
    new Map()
  )

  const registerLabel = React.useCallback(
    (val: string, label: React.ReactNode) => {
      setLabelMap((prev) => {
        if (prev.get(val) === label) return prev
        const next = new Map(prev)
        next.set(val, label)
        return next
      })
    },
    []
  )

  return (
    <SelectContext.Provider value={{ value, labelMap, registerLabel, onValueChange }}>
      <Listbox value={value} onChange={(val: string) => onValueChange?.(val)}>
        {children}
      </Listbox>
    </SelectContext.Provider>
  )
}

function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value, labelMap } = React.useContext(SelectContext)
  const label = labelMap.get(value)
  return (
    <span data-slot="select-value" className="flex flex-1 text-left">
      {label ?? value ?? placeholder}
    </span>
  )
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.HTMLAttributes<HTMLButtonElement> & {
  size?: "sm" | "default"
  disabled?: boolean
  id?: string
}) {
  return (
    <ListboxButton
      as="button"
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-fit items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-placeholder:text-muted-foreground data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] dark:bg-input/30 dark:hover:bg-input/50",
        className
      )}
      {...(props as Record<string, unknown>)}
    >
      {children}
      <ChevronDownIcon className="pointer-events-none size-4 shrink-0 text-muted-foreground" />
    </ListboxButton>
  )
}

function SelectContent({
  className,
  children,
  ...props
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <ListboxOptions
      data-slot="select-content"
      anchor={{ to: "bottom start", gap: 4 }}
      unmount={false}
      className={cn(
        "z-50 w-[var(--button-width)] max-h-60 overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 focus:outline-none empty:invisible",
        "transition data-[closed]:scale-95 data-[closed]:opacity-0 data-[leave]:duration-100 data-[enter]:duration-100",
        className
      )}
      {...props}
    >
      {children}
    </ListboxOptions>
  )
}

function SelectItem({
  value,
  children,
  className,
  ...props
}: {
  value: string
  children?: React.ReactNode
  className?: string
} & Record<string, unknown>) {
  const { registerLabel } = React.useContext(SelectContext)

  // Register label using useLayoutEffect to avoid flash on first render
  const isomorphicLayoutEffect =
    typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect
  isomorphicLayoutEffect(() => {
    registerLabel(value, children)
  }, [value, children, registerLabel])

  return (
    <ListboxOption
      data-slot="select-item"
      value={value}
      className={cn(
        "relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-none select-none data-[focus]:bg-accent data-[focus]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...(props as Record<string, unknown>)}
    >
      {({ selected }: { selected: boolean }) => (
        <>
          <span className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
            {children}
          </span>
          {selected && (
            <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
              <CheckIcon className="pointer-events-none size-4" />
            </span>
          )}
        </>
      )}
    </ListboxOption>
  )
}

function SelectGroup({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    >
      {children}
    </div>
  )
}

function SelectLabel({
  className,
  children,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="select-label"
      className={cn("px-1.5 py-1 text-xs text-muted-foreground", className)}
      {...props}
    >
      {children}
    </span>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="select-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
