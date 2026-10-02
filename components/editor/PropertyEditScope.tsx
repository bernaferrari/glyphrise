"use client"

import { createContext, useContext, type ReactNode } from "react"
import type { EditScopePanelProps } from "./EditScopePanel"
import { propertyEditScope } from "./EditScopeModel"

const EditScopeContext = createContext<EditScopePanelProps | null>(null)

export function PropertyEditScopeProvider({
  value,
  children,
}: {
  value: EditScopePanelProps
  children: ReactNode
}) {
  return (
    <EditScopeContext.Provider value={value}>
      {children}
    </EditScopeContext.Provider>
  )
}

export function usePropertyEditScope(property?: string) {
  const context = useContext(EditScopeContext)
  if (!context || !property) return null
  const definition = context.properties.find((item) => item.name === property)
  return {
    ...propertyEditScope(
      definition?.times ?? [],
      context.currentTime,
      context.autoKeyEnabled,
      Boolean(definition)
    ),
    enableEditing: () => context.onAutoKeyChange(true),
    time: context.currentTime.toFixed(2),
  }
}
