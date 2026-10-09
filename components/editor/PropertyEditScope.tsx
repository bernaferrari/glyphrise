"use client"

import { createContext, useContext, type ReactNode } from "react"
import { propertyEditScope } from "./EditScopeModel"

/** Which properties are animated, and when, for the inspector's edit hints. */
export type EditScopeContextValue = {
  currentTime: number
  properties: Array<{ name: string; times: number[]; onToggle?: () => void }>
}

const EditScopeContext = createContext<EditScopeContextValue | null>(null)

export function PropertyEditScopeProvider({
  value,
  children,
}: {
  value: EditScopeContextValue
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
      Boolean(definition)
    ),
    time: context.currentTime.toFixed(2),
    onToggle: definition?.onToggle,
  }
}
