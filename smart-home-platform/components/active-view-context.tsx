"use client"
import React, { createContext, useContext, useState } from "react"

const ActiveViewContext = createContext<{
  activeView: string
  setActiveView: (v: string) => void
}>({
  activeView: "dashboard",
  setActiveView: () => {},
})

export const useActiveView = () => useContext(ActiveViewContext)

export const ActiveViewProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeView, setActiveView] = useState("dashboard")
  return (
    <ActiveViewContext.Provider value={{ activeView, setActiveView }}>
      {children}
    </ActiveViewContext.Provider>
  )
} 