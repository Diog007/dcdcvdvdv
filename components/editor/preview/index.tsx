"use client";
import { useUpdateEffect } from "react-use";
import React, { useMemo, useState, forwardRef } from "react";
import classNames from "classnames";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { GridPattern } from "@/components/magic-ui/grid-pattern";
import { SelectedElementToolbar } from "../ask-ai/SelectedElementToolbar";

interface PreviewProps {
  html: string;
  setHtml: (html: string) => void;
  isResizing: boolean;
  isAiWorking: boolean;
  device: "desktop" | "mobile";
  currentTab: string;
  isEditableModeEnabled?: boolean;
  onElementSelect: (element: HTMLElement) => void;
}

export const Preview = forwardRef<HTMLDivElement, PreviewProps>(
  (
    {
      html,
      setHtml,
      isResizing,
      isAiWorking,
      device,
      currentTab,
      isEditableModeEnabled,
      onElementSelect,
    },
    ref
  ) => {
    const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(
      null
    );
    const iframeRef = React.useRef<HTMLIFrameElement | null>(null);

    const makeElementEditable = (element: HTMLElement) => {
      element.setAttribute("contentEditable", "true");
      element.focus();
      element.classList.add("editing-element");

      const handleBlur = () => {
        finishEditing(element);
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          finishEditing(element);
        }
        if (e.key === "Escape") {
          // Restore original content on Escape
          const originalContent = element.getAttribute("data-original-html");
          if (originalContent) {
            element.innerHTML = originalContent;
          }
          finishEditing(element);
        }
      };

      element.addEventListener("blur", handleBlur, { once: true });
      element.addEventListener("keydown", handleKeyDown, { once: true });
    };

    const finishEditing = (element: HTMLElement) => {
      element.removeAttribute("contentEditable");
      element.classList.remove("editing-element");

      const originalHtml = element.getAttribute("data-original-html");
      const newHtml = element.innerHTML;

      if (originalHtml !== newHtml) {
        // Update the main HTML state
        const fullHtml = iframeRef.current?.contentDocument?.documentElement.outerHTML;
        if (fullHtml) {
          setHtml(fullHtml);
          toast.success("Element updated!");
        }
      }
      element.removeAttribute("data-original-html");
    };

    const handleElementClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const target = e.target as HTMLElement;
      if (target && target.tagName !== "BODY" && target.tagName !== "HTML") {
        setSelectedElement(target);
        onElementSelect(target);
      }
    };

    useUpdateEffect(() => {
      const iframeDoc = iframeRef.current?.contentDocument;
      if (iframeDoc) {
        // Clear previous listeners
        iframeDoc.removeEventListener("click", handleElementClick);

        if (isEditableModeEnabled) {
          iframeDoc.addEventListener("click", handleElementClick);
          iframeDoc.body.style.cursor = "pointer";
        } else {
          iframeDoc.body.style.cursor = "default";
          setSelectedElement(null);
        }
      }

      return () => {
        if (iframeDoc) {
          iframeDoc.removeEventListener("click", handleElementClick);
        }
      };
    }, [isEditableModeEnabled, html]); // Re-attach listeners when mode or html changes

    return (
      <div
        ref={ref}
        className={classNames(
          "w-full border-l border-gray-900 h-full relative z-0 flex items-center justify-center",
          {
            "lg:p-4": currentTab !== "preview",
            "max-lg:h-0": currentTab === "chat",
            "max-lg:h-full": currentTab === "preview",
          }
        )}
        onClick={(e) => {
          if (isAiWorking) {
            e.preventDefault();
            e.stopPropagation();
            toast.warning("Please wait for the AI to finish working.");
          }
        }}
      >
        <GridPattern
          x={-1}
          y={-1}
          strokeDasharray={"4 2"}
          className={cn(
            "[mask-image:radial-gradient(900px_circle_at_center,white,transparent)]"
          )}
        />
        {isEditableModeEnabled && selectedElement && (
          <SelectedElementToolbar
            element={selectedElement}
            onDelete={() => setSelectedElement(null)}
            onEdit={() => {
              selectedElement.setAttribute(
                "data-original-html",
                selectedElement.innerHTML
              );
              makeElementEditable(selectedElement);
              setSelectedElement(null); // Hide toolbar while editing
            }}
          />
        )}
        <iframe
          id="preview-iframe"
          ref={iframeRef}
          title="output"
          className={classNames(
            "w-full select-none transition-all duration-200 bg-white h-full",
            {
              "pointer-events-none": isResizing || isAiWorking,
              "lg:max-w-md lg:mx-auto lg:!rounded-[42px] lg:border-[8px] lg:border-neutral-700 lg:shadow-2xl lg:h-[80dvh] lg:max-h-[996px]":
                device === "mobile",
              "lg:border-[8px] lg:border-neutral-700 lg:shadow-2xl lg:rounded-[24px]":
                currentTab !== "preview" && device === "desktop",
            }
          )}
          srcDoc={html}
          onLoad={() => {
            if (iframeRef?.current?.contentWindow?.document?.body) {
              iframeRef.current.contentWindow.document.body.scrollIntoView({
                block: isAiWorking ? "end" : "start",
                inline: "nearest",
                behavior: isAiWorking ? "instant" : "smooth",
              });
            }
          }}
        />
      </div>
    );
  }
);

Preview.displayName = "Preview";