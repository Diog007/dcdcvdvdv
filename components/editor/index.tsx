"use client";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { editor } from "monaco-editor";
import Editor from "@monaco-editor/react";
import { CopyIcon } from "lucide-react";
import {
  useCopyToClipboard,
  useEvent,
  useLocalStorage,
  useMount,
  useUnmount,
  useUpdateEffect,
} from "react-use";
import classNames from "classnames";
import { useRouter, useSearchParams } from "next/navigation";

import { Header } from "@/components/editor/header";
import { Footer } from "@/components/editor/footer";
import { defaultHTML } from "@/lib/consts";
import { Preview } from "@/components/editor/preview";
import { useEditor } from "@/hooks/useEditor";
import { AskAI } from "@/components/editor/ask-ai";
import { DeployButton } from "./deploy-button";
import { Project } from "@/types";
import { SaveButton } from "./save-button";
import { LoadProject } from "../my-projects/load-project";
import { isTheSameHtml } from "@/lib/compare-html-diff";

export const AppEditor = ({ project }: { project?: Project | null }) => {
  const [htmlStorage, , removeHtmlStorage] = useLocalStorage("html_content");
  const [, copyToClipboard] = useCopyToClipboard();
  const { html, setHtml, htmlHistory, setHtmlHistory, prompts, setPrompts } =
    useEditor(project?.html ?? (htmlStorage as string) ?? defaultHTML);
  const searchParams = useSearchParams();
  const router = useRouter();
  const deploy = searchParams.get("deploy") === "true";

  const previewRef = useRef<HTMLDivElement | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const resizerRef = useRef<HTMLDivElement | null>(null);
  const monacoRef = useRef<any>(null);

  const [currentTab, setCurrentTab] = useState("chat");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [isResizing, setIsResizing] = useState(false);
  const [isAiWorking, setIsAiWorking] = useState(false);
  const [isEditableModeEnabled, setIsEditableModeEnabled] = useState(false);
  // NOVO: Estado para o modo de seleção da IA
  const [isAiSelectionModeEnabled, setIsAiSelectionModeEnabled] = useState(false);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(
    null
  );

  const resetLayout = () => {
    if (!editorContainerRef.current || !previewRef.current) return;
    if (window.innerWidth >= 1024) {
      const resizerWidth = resizerRef.current?.offsetWidth ?? 8;
      const availableWidth = window.innerWidth - resizerWidth;
      const initialEditorWidth = availableWidth / 3;
      const initialPreviewWidth = availableWidth - initialEditorWidth;
      editorContainerRef.current.style.width = `${initialEditorWidth}px`;
      previewRef.current.style.width = `${initialPreviewWidth}px`;
    } else {
      editorContainerRef.current.style.width = "";
      previewRef.current.style.width = "";
    }
  };

  const handleResize = (e: MouseEvent) => {
    if (!editorContainerRef.current || !previewRef.current || !resizerRef.current)
      return;
    const resizerWidth = resizerRef.current.offsetWidth;
    const minWidth = 100;
    const maxWidth = window.innerWidth - resizerWidth - minWidth;
    const editorWidth = e.clientX;
    const clampedEditorWidth = Math.max(
      minWidth,
      Math.min(editorWidth, maxWidth)
    );
    const calculatedPreviewWidth =
      window.innerWidth - clampedEditorWidth - resizerWidth;
    editorContainerRef.current.style.width = `${clampedEditorWidth}px`;
    previewRef.current.style.width = `${calculatedPreviewWidth}px`;
  };

  const handleMouseDown = () => {
    setIsResizing(true);
    document.addEventListener("mousemove", handleResize);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    document.removeEventListener("mousemove", handleResize);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  useMount(() => {
    if (deploy && project?._id) {
      toast.success("Your project is deployed! 🎉", {
        action: {
          label: "See Project",
          onClick: () => {
            window.open(
              `https://huggingface.co/spaces/${project?.space_id}`,
              "_blank"
            );
          },
        },
      });
      router.replace(`/projects/${project?.space_id}`);
    }
    if (htmlStorage) {
      removeHtmlStorage();
      toast.warning("Previous HTML content restored from local storage.");
    }
    resetLayout();
    if (resizerRef.current) {
      resizerRef.current.addEventListener("mousedown", handleMouseDown);
    }
    window.addEventListener("resize", resetLayout);
  });

  useUnmount(() => {
    document.removeEventListener("mousemove", handleResize);
    document.removeEventListener("mouseup", handleMouseUp);
    if (resizerRef.current) {
      resizerRef.current.removeEventListener("mousedown", handleMouseDown);
    }
    window.removeEventListener("resize", resetLayout);
  });

  useEvent("beforeunload", (e) => {
    if (isAiWorking || !isTheSameHtml(html)) {
      e.preventDefault();
      return "";
    }
  });

  useUpdateEffect(() => {
    if (currentTab === "chat") {
      resetLayout();
      if (resizerRef.current) {
        resizerRef.current.addEventListener("mousedown", handleMouseDown);
      }
    } else if (previewRef.current) {
      previewRef.current.style.width = "100%";
    }
  }, [currentTab]);

  return (
    <section className="h-[100dvh] bg-neutral-950 flex flex-col">
      <Header tab={currentTab} onNewTab={setCurrentTab}>
        <LoadProject
          onSuccess={(project: Project) => {
            router.push(`/projects/${project.space_id}`);
          }}
        />
        {project?._id ? (
          <SaveButton html={html} prompts={prompts} />
        ) : (
          <DeployButton html={html} prompts={prompts} />
        )}
      </Header>
      <main className="bg-neutral-950 flex-1 max-lg:flex-col flex w-full max-lg:h-[calc(100%-82px)] relative">
        {currentTab === "chat" && (
          <>
            <div
              ref={editorContainerRef}
              className="bg-neutral-900 relative flex-1 overflow-hidden h-full flex flex-col gap-2 pb-3"
            >
              <CopyIcon
                className="size-4 absolute top-2 right-5 text-neutral-500 hover:text-neutral-300 z-2 cursor-pointer"
                onClick={() => {
                  copyToClipboard(html);
                  toast.success("HTML copied to clipboard!");
                }}
              />
              <Editor
                defaultLanguage="html"
                theme="vs-dark"
                className={classNames(
                  "h-full bg-neutral-900 transition-all duration-200 absolute left-0 top-0",
                  { "pointer-events-none": isAiWorking }
                )}
                options={{
                  colorDecorators: true,
                  fontLigatures: true,
                  theme: "vs-dark",
                  minimap: { enabled: false },
                  scrollbar: { horizontal: "hidden" },
                  wordWrap: "on",
                }}
                value={html}
                onChange={(value) => setHtml(value ?? "")}
                onMount={(editor, monaco) => {
                  editorRef.current = editor;
                  monacoRef.current = monaco;
                }}
              />
              <AskAI
                html={html}
                setHtml={setHtml}
                htmlHistory={htmlHistory}
                onSuccess={(finalHtml, p, updatedLines) => {
                  setHtmlHistory((prev) => [
                    { html: finalHtml, createdAt: new Date(), prompt: p },
                    ...prev,
                  ]);
                  setSelectedElement(null);
                  if (window.innerWidth <= 1024) setCurrentTab("preview");
                  if (updatedLines?.length) {
                    // Highlight logic here...
                  }
                }}
                isAiWorking={isAiWorking}
                setisAiWorking={setIsAiWorking}
                onNewPrompt={(prompt) => setPrompts((prev) => [...prev, prompt])}
                onScrollToBottom={() =>
                  editorRef.current?.revealLine(
                    editorRef.current?.getModel()?.getLineCount() ?? 0
                  )
                }
                isEditableModeEnabled={isEditableModeEnabled}
                setIsEditableModeEnabled={setIsEditableModeEnabled}
                isAiSelectionModeEnabled={isAiSelectionModeEnabled} // NOVO
                setIsAiSelectionModeEnabled={setIsAiSelectionModeEnabled} // NOVO
                selectedElement={selectedElement}
                setSelectedElement={setSelectedElement}
              />
            </div>
            <div
              ref={resizerRef}
              className="bg-neutral-800 hover:bg-sky-500 active:bg-sky-500 w-1.5 cursor-col-resize h-full max-lg:hidden"
            />
          </>
        )}
        <Preview
          ref={previewRef}
          html={html}
          setHtml={setHtml}
          isResizing={isResizing}
          isAiWorking={isAiWorking}
          device={device}
          currentTab={currentTab}
          isEditableModeEnabled={isEditableModeEnabled}
          isAiSelectionModeEnabled={isAiSelectionModeEnabled} // NOVO
          onElementSelect={(element) => {
            setSelectedElement(element);
            if (isAiSelectionModeEnabled && window.innerWidth <= 1024) {
              setCurrentTab("chat");
            }
          }}
        />
      </main>
      <Footer
        onReset={() => {
          if (isAiWorking) {
            toast.warning("Please wait for the AI to finish working.");
            return;
          }
          if (window.confirm("Are you sure you want to reset the editor?")) {
            setHtml(defaultHTML);
            removeHtmlStorage();
          }
        }}
        htmlHistory={htmlHistory}
        setHtml={setHtml}
        device={device}
        setDevice={setDevice}
      />
    </section>
  );
};