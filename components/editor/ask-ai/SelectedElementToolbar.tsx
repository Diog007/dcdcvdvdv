import { PenLine, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { htmlTagToText } from "@/lib/html-tag-to-text";

export const SelectedElementToolbar = ({
  element,
  onEdit,
  onDelete,
}: {
  element: HTMLElement;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const tagName = element.tagName.toLowerCase();
  const tagText = htmlTagToText(tagName);

  const isTextElement = [
    "p",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "span",
    "button",
    "a",
    "li",
  ].includes(tagName);

  return (
    <div
      className="absolute bg-neutral-900 border border-neutral-700 rounded-lg p-1.5 flex items-center gap-1 shadow-lg"
      style={{
        top: element.getBoundingClientRect().top - 45,
        left: element.getBoundingClientRect().left,
        zIndex: 100,
      }}
    >
      <span className="text-xs text-neutral-300 font-semibold pl-2 pr-1">
        {tagText}
      </span>

      {isTextElement && (
        <Button
          size="iconXss"
          variant="ghost"
          className="!text-neutral-300 hover:!bg-neutral-700"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          title="Edit Text"
        >
          <PenLine className="size-3.5" />
        </Button>
      )}

      <Button
        size="iconXss"
        variant="ghost"
        className="!text-red-500/80 hover:!bg-red-500/20 hover:!text-red-500"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Deselect"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
};