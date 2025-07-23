"use client";

import { useEffect, useState } from "react";
import { Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LinkEditorModalProps {
  open: boolean;
  currentUrl: string;
  onOpenChange: (open: boolean) => void;
  onSave: (newUrl: string) => void;
}

export const LinkEditorModal = ({
  open,
  currentUrl,
  onOpenChange,
  onSave,
}: LinkEditorModalProps) => {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (open) {
      setUrl(currentUrl);
    }
  }, [open, currentUrl]);

  const handleSave = () => {
    onSave(url);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] !bg-neutral-900 border-neutral-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-neutral-200">
            <Link className="size-4" />
            Add or Edit Link
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="url" className="text-right text-neutral-400">
              URL
            </Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="col-span-3"
              placeholder="https://example.com"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSave();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSave}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};