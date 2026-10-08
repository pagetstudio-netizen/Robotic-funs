import * as React from "react"
import { useLocation } from "wouter"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastProvider,
  ToastTitle,
  ToastDescription,
  ToastViewport,
} from "@/components/ui/toast"
import { cn } from "@/lib/utils"

const TOAST_DURATION_MS = 2500
const INVITE_TOAST_DURATION_MS = 3000

export function Toaster() {
  const { toasts } = useToast()
  const [location] = useLocation()
  const isRobotPay = location === "/robotpay"
  const isInviteTab = location === "/tasks"

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, variant, action, ...props }) {
        const actionElement =
          !isRobotPay && action && React.isValidElement(action)
            ? React.cloneElement(action as React.ReactElement<{ className?: string }>, {
                className: cn(
                  (action.props as { className?: string }).className,
                  "border-white/30 bg-white/10 text-white hover:bg-white/20"
                ),
              })
            : action

        return (
          <Toast
            key={id}
            variant={variant}
            duration={isInviteTab ? INVITE_TOAST_DURATION_MS : TOAST_DURATION_MS}
            className={
              isRobotPay
                ? undefined
                : cn(
                    "w-[min(220px,calc(100vw-2rem))] min-h-0 max-h-[190px] flex-col items-center justify-center gap-1.5 rounded-[10px] border-0 bg-[rgba(35,35,35,0.81)] px-4 py-[18px] text-center text-white shadow-[0_8px_28px_rgba(0,0,0,0.18)] backdrop-blur-[1px]",
                    "data-[state=open]:slide-in-from-bottom-2 data-[state=closed]:slide-out-to-bottom-1 data-[state=closed]:fade-out-0 motion-reduce:animate-none motion-reduce:transition-none"
                  )
            }
            {...props}
          >
            {!isRobotPay && (
              <span className="shrink-0 text-[48px] font-medium leading-none text-white" aria-hidden="true">
                !
              </span>
            )}
            <div className={cn("flex min-w-0 flex-col gap-1", !isRobotPay && "w-full items-center text-center")}>
              {title && (
                <ToastTitle
                  className={cn(
                    "whitespace-normal",
                    !isRobotPay && "line-clamp-1 text-[16px] font-normal leading-[1.4] text-white"
                  )}
                >
                  {title}
                </ToastTitle>
              )}
              {description && (
                <ToastDescription
                  className={cn(
                    "whitespace-normal break-words",
                    !isRobotPay && "line-clamp-3 text-[16px] font-normal leading-[1.4] text-white opacity-100"
                  )}
                >
                  {description}
                </ToastDescription>
              )}
              {actionElement && (
                <div className="mt-3 flex justify-end">
                  {actionElement}
                </div>
              )}
            </div>
          </Toast>
        )
      })}
      <ToastViewport
        className={
          isRobotPay
            ? "top-[55%]"
            : "top-1/2 w-[min(26rem,calc(100vw-1rem))] gap-3"
        }
      />
    </ToastProvider>
  )
}
