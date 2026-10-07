"use client"

import React from "react"
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu"
import { easingCurvePath } from "./TimelineEasingControls"
import type { TimelineMenuState } from "./TimelineMenuModel"

export const TimelineContextMenu = ({
  menu,
  onClose,
}: {
  menu: TimelineMenuState
  onClose: () => void
}) => {
  const anchor = React.useMemo(
    () =>
      menu
        ? {
            getBoundingClientRect: () => new DOMRect(menu.x, menu.y, 0, 0),
          }
        : undefined,
    [menu]
  )

  if (!menu) return null

  return (
    <ContextMenuContent
      variant="editor"
      anchor={anchor}
      positionMethod="fixed"
      collisionPadding={8}
      className="min-w-44"
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      {menu.title && (
        <div className="px-2 pt-0.5 pb-1 text-2xs font-medium tracking-widest text-muted-foreground uppercase">
          {menu.title}
        </div>
      )}
      {menu.items.map((item, index) => {
        if (item.type === "separator") {
          return (
            <ContextMenuSeparator
              variant="editor"
              key={`separator-${index}`}
              className="my-1"
            />
          )
        }

        if (item.type === "submenu") {
          return (
            <ContextMenuSub key={`${item.label}-${index}`}>
              <ContextMenuSubTrigger size="editor" className="h-7">
                <span className="truncate">{item.label}</span>
                {item.shortcut && (
                  <ContextMenuShortcut variant="editor">
                    {item.shortcut}
                  </ContextMenuShortcut>
                )}
              </ContextMenuSubTrigger>
              <ContextMenuSubContent variant="editor" className="min-w-36">
                {item.items.map((child, childIndex) => (
                  <ContextMenuItem
                    size="editor-submenu"
                    key={`${child.label}-${childIndex}`}
                    onSelect={() => {
                      child.onSelect()
                      onClose()
                    }}
                    className="h-7 justify-between"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      {child.easing && (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          className="shrink-0"
                        >
                          <path
                            d={easingCurvePath(child.easing)}
                            stroke="currentColor"
                            className={
                              child.active
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                      <span className="truncate">{child.label}</span>
                    </span>
                    {child.active && (
                      <span className="size-1.5 rounded-full bg-foreground" />
                    )}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>
          )
        }

        return (
          <ContextMenuItem
            size="editor"
            key={`${item.label}-${index}`}
            disabled={item.disabled}
            variant={item.danger ? "destructive" : "default"}
            onSelect={() => {
              if (item.disabled) return
              item.onSelect()
              onClose()
            }}
            className="h-7 justify-between"
          >
            <span className="flex min-w-0 items-center gap-2">
              {item.easing && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="shrink-0"
                >
                  <path
                    d={easingCurvePath(item.easing)}
                    stroke="currentColor"
                    className={
                      item.active ? "text-foreground" : "text-muted-foreground"
                    }
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              <span className="truncate">{item.label}</span>
            </span>
            {item.shortcut && (
              <ContextMenuShortcut variant="mono">
                {item.shortcut}
              </ContextMenuShortcut>
            )}
            {item.active && !item.shortcut && (
              <span className="size-1.5 rounded-full bg-foreground" />
            )}
          </ContextMenuItem>
        )
      })}
    </ContextMenuContent>
  )
}
