
"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { Lightbulb, Zap, HeartPulse, BrainCircuit, Rocket } from "lucide-react"
import type { LucideIcon } from 'lucide-react';

const tipIcons: Record<string, LucideIcon> = {
  Productivity: Zap,
  Health: HeartPulse,
  Mindfulness: BrainCircuit,
  Efficiency: Rocket,
  Motivation: Lightbulb,
};


export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, tipType, ...props }) {
        const Icon = tipType ? tipIcons[tipType] : null;

        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1 w-full">
              {Icon && <Icon className="h-6 w-6 text-primary mx-auto mb-2" />}
              {title && <ToastTitle className={props.variant === 'dark' ? 'text-primary' : ''}>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
