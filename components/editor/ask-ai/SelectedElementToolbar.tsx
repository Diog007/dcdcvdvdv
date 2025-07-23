import { PenLine, Trash2, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { htmlTagToText } from "@/lib/html-tag-to-text";

export const SelectedElementToolbar = ({
  element,
  onEdit,
  onDelete,
  onLink,
}: {
  element: HTMLElement;
  onEdit: () => void;
  onDelete: () => void;
  onLink: () => void;
}) => {
  const tagName = element.tagName.toLowerCase();
  const tagText = htmlTagToText(tagName);

  const isTextElement = [
    "p", "h1", "h2", "h3", "h4", "h5", "h6",
    "span", "button", "a", "li",
  ].includes(tagName);

  const isLinkableElement = ["a", "button"].includes(tagName);

  return (
    <div
      className="absolute bg-neutral-950 border border-neutral-700 rounded-lg p-1 flex items-center gap-1 shadow-2xl"
      style={{
        top: element.getBoundingClientRect().top - 48, // Adjusted for more space
        left: element.getBoundingClientRect().left,
        zIndex: 100,
      }}
    >
      <span className="text-xs text-neutral-400 font-semibold pl-2 pr-1 select-none">
        {tagText}
      </span>

      {isTextElement && (
        <Button
          size="iconXss"
          variant="ghost"
          className="!text-neutral-300 hover:!bg-neutral-800"
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          title="Edit Text"
        >
          <PenLine className="size-4" />
        </Button>
      )}

      {isLinkableElement && (
        <Button
          size="iconXss"
          variant="ghost"
          className="!text-neutral-300 hover:!bg-neutral-800"
          onClick={(e) => { e.stopPropagation(); onLink(); }}
          title="Add/Edit Link"
        >
          <LinkIcon className="size-4" />
        </Button>
      )}

      <div className="w-px h-4 bg-neutral-700 mx-1"></div>

      <Button
        size="iconXss"
        variant="ghost"
        className="!text-neutral-400 hover:!bg-red-500/20 hover:!text-red-500"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        title="Deselect"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
};