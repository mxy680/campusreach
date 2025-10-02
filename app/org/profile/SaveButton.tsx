"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"

export default function SaveButton({ saving, onSave, disabled }: { saving: boolean; onSave: () => void; disabled?: boolean }) {
  return (
    <Button size="sm" onClick={onSave} disabled={!!disabled || saving}>
      {saving ? "Saving…" : "Save Changes"}
    </Button>
  )
}
