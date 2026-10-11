"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useReducer, useRef, useState } from "react";
import { saveCardArtwork } from "@/app/actions/artwork";
import {
  Artboard,
  BackArtboard,
  ImportPlate,
} from "@/components/designer/artboards";
import {
  renderBackPng,
  renderCardPng,
} from "@/components/designer/card-canvas";
import { ModeButton, ToolButton } from "@/components/designer/controls";
import { type CropPurpose, Cropper } from "@/components/designer/cropper";
import {
  BackInspector,
  type BackLayer,
  ImportInspector,
  Inspector,
} from "@/components/designer/inspectors";
import { BackLayers, FrontLayers } from "@/components/designer/layer-list";
import { useDesignerKeys } from "@/components/designer/use-designer-keys";
import { FormNotice } from "@/components/ui/form-notice";
import { Spinner } from "@/components/ui/spinner";
import { useUnsavedWarning } from "@/components/ui/use-unsaved-warning";
import {
  type CardBack,
  type CardDesign,
  cardAssetPath,
  cardBackPath,
  cardPngPath,
  defaultBack,
  defaultDesign,
  hydrateDesign,
  type LayerId,
  type StoredBack,
  type StoredCardDesign,
  serializeBack,
  serializeDesign,
} from "@/lib/card-design";
import { placeLayer, roundZoom } from "@/lib/design-edits";
import { historyReducer, startHistory } from "@/lib/design-history";
import { imageFileProblem } from "@/lib/image-upload";
import { tapUrl } from "@/lib/tap-url";
import { useSupabase } from "@/utils/supabase/client";

type Mode = "template" | "import";
type Face = "front" | "back";

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;

export function CardDesigner({
  cardId,
  userId,
  title,
  publicId,
  savedDesign,
  savedImageUrl,
  backgroundUrl,
  photoUrl,
}: {
  cardId: number;
  userId: string;
  title: string;
  publicId: string;
  savedDesign: StoredCardDesign | null;
  savedImageUrl: string | null;
  backgroundUrl: string | null;
  photoUrl: string | null;
}) {
  const router = useRouter();
  const supabase = useSupabase();
  const cardLink = tapUrl(publicId);
  const [history, dispatch] = useReducer(historyReducer, null, () =>
    startHistory(
      savedDesign?.template
        ? hydrateDesign(savedDesign.template, { backgroundUrl, photoUrl })
        : defaultDesign(title),
      savedDesign?.back ?? defaultBack(title),
    ),
  );
  const [mode, setMode] = useState<Mode>(
    savedDesign?.template || !savedImageUrl ? "template" : "import",
  );
  const [face, setFace] = useState<Face>("front");
  const [selected, setSelected] = useState<LayerId>("name");
  const [backLayer, setBackLayer] = useState<BackLayer>("note");
  const [guides, setGuides] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [importUrl, setImportUrl] = useState(savedImageUrl);
  const [savedImportUrl, setSavedImportUrl] = useState(savedImageUrl);
  const [savedTemplate, setSavedTemplate] = useState(
    savedDesign?.template ?? null,
  );
  const [savedBack, setSavedBack] = useState<StoredBack | null>(
    savedDesign?.back ?? null,
  );
  const [assetMark, setAssetMark] = useState(0);
  const [savedAssetMark, setSavedAssetMark] = useState(0);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropPurpose, setCropPurpose] = useState<CropPurpose>("import");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const staged = useStagedBlobs();
  const gesture = useRef<CardDesign | null>(null);
  const backGesture = useRef<CardBack | null>(null);

  const { design, back } = history;
  const templateEdited =
    JSON.stringify(serializeDesign(design)) !==
      JSON.stringify(savedTemplate ?? serializeDesign(defaultDesign(title))) ||
    assetMark !== savedAssetMark;
  const importEdited = importUrl !== savedImportUrl;
  const backEdited =
    JSON.stringify(serializeBack(back)) !==
    JSON.stringify(savedBack ?? serializeBack(defaultBack(title)));
  const edited =
    (mode === "import" ? importEdited : templateEdited) || backEdited;
  // A template that was never saved can be saved as is.
  const canSave = edited || (mode === "template" && savedTemplate == null);
  useUnsavedWarning(edited);
  useDesignerKeys(dispatch, {
    design,
    selected,
    editingLayers: face === "front" && mode === "template",
  });

  const live = (next: CardDesign) => dispatch({ type: "live", design: next });
  const record = (next: CardDesign) =>
    dispatch({ type: "replace", design: next });
  const liveBack = (next: CardBack) =>
    dispatch({ type: "live-back", back: next });
  const recordBack = (next: CardBack) =>
    dispatch({ type: "replace-back", back: next });

  function beginGesture() {
    gesture.current = design;
  }

  function endGesture() {
    const before = gesture.current;
    gesture.current = null;
    if (before) {
      dispatch({ type: "commit", before });
    }
  }

  function beginBackGesture() {
    backGesture.current = back;
  }

  function endBackGesture() {
    const before = backGesture.current;
    backGesture.current = null;
    if (before) {
      dispatch({ type: "commit-back", before });
    }
  }

  function openFile(purpose: CropPurpose) {
    setCropPurpose(purpose);
    fileRef.current?.click();
  }

  function onFile(file: File | undefined) {
    if (!file) {
      return;
    }
    const problem = imageFileProblem(file);
    setError(problem);
    if (!problem) {
      setCropFile(file);
    }
  }

  function applyCrop(blob: Blob) {
    const url = staged.add(blob);
    setCropFile(null);
    setAssetMark((mark) => mark + 1);
    if (cropPurpose === "import") {
      setImportUrl(url);
      setMode("import");
      return;
    }
    if (cropPurpose === "background") {
      record({ ...design, backgroundUrl: url });
      return;
    }
    record({
      ...design,
      photo: {
        url,
        shape: design.photo?.shape ?? "circle",
        x: design.photo?.x ?? 0.82,
        y: design.photo?.y ?? 0.3,
        size: design.photo?.size ?? 0.34,
      },
    });
    setSelected("photo");
  }

  async function upload(path: string, blob: Blob | undefined) {
    if (!blob) {
      return;
    }
    const { error: uploadError } = await supabase.storage
      .from("cards")
      .upload(path, blob, { upsert: true, contentType: "image/png" });
    if (uploadError) {
      throw new Error(uploadError.message);
    }
  }

  async function saveFront(): Promise<StoredCardDesign["template"]> {
    const path = cardPngPath(userId, cardId);
    if (mode === "import") {
      const blob = staged.get(importUrl);
      if (!blob && !savedImageUrl) {
        throw new Error("Crop an image before saving.");
      }
      await upload(path, blob);
      return null;
    }
    await upload(path, await renderCardPng(design));
    await upload(
      cardAssetPath(userId, cardId, "background"),
      staged.get(design.backgroundUrl),
    );
    await upload(
      cardAssetPath(userId, cardId, "photo"),
      staged.get(design.photo?.url ?? null),
    );
    return serializeDesign(design);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const storedBack =
        savedBack != null || backEdited ? serializeBack(back) : null;
      if (storedBack) {
        await upload(
          cardBackPath(userId, cardId),
          await renderBackPng(back, cardLink),
        );
      }
      const template = await saveFront();
      const result = await saveCardArtwork({
        id: cardId,
        design:
          template || storedBack
            ? { version: 1, template, back: storedBack }
            : null,
      });
      if ("error" in result) {
        throw new Error(result.error);
      }
      setSavedTemplate(template);
      setSavedBack(storedBack);
      if (mode === "import") {
        setSavedImportUrl(importUrl);
      } else {
        setSavedAssetMark(assetMark);
      }
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not save that card.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-4.5rem)] min-h-[640px] flex-col">
      <header className="flex flex-wrap items-center gap-2 border-b border-black/8 px-4 py-2 dark:border-white/10">
        <Link
          href="/"
          className="rounded-full px-3 py-1.5 text-sm text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
        >
          Cards
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-sm font-medium">{title}</h1>
        <Segmented
          value={face}
          options={[
            ["front", "Front"],
            ["back", "Back"],
          ]}
          onChange={setFace}
        />
        {face === "front" ? (
          <Segmented
            value={mode}
            options={[
              ["template", "Template"],
              ["import", "Import"],
            ]}
            onChange={setMode}
          />
        ) : null}
        <ToolButton
          label="Undo"
          disabled={history.past.length === 0 || saving}
          onClick={() => dispatch({ type: "undo" })}
        >
          Undo
        </ToolButton>
        <ToolButton
          label="Redo"
          disabled={history.future.length === 0 || saving}
          onClick={() => dispatch({ type: "redo" })}
        >
          Redo
        </ToolButton>
        <ToolButton
          label="Zoom out"
          disabled={zoom <= ZOOM_MIN}
          onClick={() =>
            setZoom((value) => Math.max(ZOOM_MIN, roundZoom(value - 0.1)))
          }
        >
          −
        </ToolButton>
        <span className="w-12 text-center text-xs text-zinc-500">
          {Math.round(zoom * 100)}%
        </span>
        <ToolButton
          label="Zoom in"
          disabled={zoom >= ZOOM_MAX}
          onClick={() =>
            setZoom((value) => Math.min(ZOOM_MAX, roundZoom(value + 0.1)))
          }
        >
          +
        </ToolButton>
        <ToolButton label="Fit" onClick={() => setZoom(1)}>
          Fit
        </ToolButton>
        <ToolButton
          label="Safe zones"
          pressed={guides}
          onClick={() => setGuides((value) => !value)}
        >
          Guides
        </ToolButton>
        <button
          type="button"
          disabled={!canSave || saving}
          onClick={save}
          className="inline-flex h-9 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-medium text-background disabled:opacity-50"
        >
          {saving ? <Spinner /> : null}
          {saving ? "Saving…" : "Save"}
        </button>
      </header>
      <FormNotice dirty={edited} error={error} className="px-4 pt-2 text-xs" />
      <div className="grid min-h-0 flex-1 grid-cols-[200px_minmax(0,1fr)_280px]">
        <aside className="flex flex-col gap-1 border-r border-black/8 p-3 dark:border-white/10">
          {face === "back" ? (
            <BackLayers selected={backLayer} onSelect={setBackLayer} />
          ) : mode === "template" ? (
            <FrontLayers selected={selected} onSelect={setSelected} />
          ) : (
            <button
              type="button"
              onClick={() => openFile("import")}
              className="h-9 rounded-lg bg-foreground px-3 text-sm text-background"
            >
              Upload image
            </button>
          )}
          <p className="mt-auto text-xs leading-5 text-zinc-500">
            2024 × 1276
            <br />
            85.6 × 53.98 mm
            <br />
            <br />
            {face === "back"
              ? "The back is the same card. The QR is the prominent mark, and the line sits under it."
              : "Chip is a blank spot for a metal contact on a printed card. Tap mark is the contactless symbol. Neither is a logo, and neither is drawn on the phone."}
          </p>
        </aside>
        <main className="min-h-0 overflow-auto bg-zinc-200 p-6 dark:bg-zinc-950">
          {face === "back" ? (
            <BackArtboard
              back={back}
              url={cardLink}
              selected={backLayer === "note"}
              zoom={zoom}
            />
          ) : cropFile ? (
            <Cropper
              file={cropFile}
              purpose={cropPurpose}
              onCancel={() => setCropFile(null)}
              onApply={applyCrop}
            />
          ) : mode === "import" ? (
            <ImportPlate
              url={importUrl}
              guides={guides}
              zoom={zoom}
              onUpload={() => openFile("import")}
            />
          ) : (
            <Artboard
              design={design}
              guides={guides}
              selected={selected}
              zoom={zoom}
              onSelect={setSelected}
              onBegin={beginGesture}
              onMove={(id, x, y) => live(placeLayer(design, id, x, y))}
              onCommit={endGesture}
            />
          )}
        </main>
        <aside className="overflow-auto border-l border-black/8 p-4 dark:border-white/10">
          {face === "back" ? (
            <BackInspector
              back={back}
              selected={backLayer}
              onLive={liveBack}
              onRecord={recordBack}
              onBegin={beginBackGesture}
              onCommit={endBackGesture}
            />
          ) : mode === "import" ? (
            <ImportInspector onUpload={() => openFile("import")} />
          ) : (
            <Inspector
              design={design}
              selected={selected}
              onLive={live}
              onRecord={record}
              onBegin={beginGesture}
              onCommit={endGesture}
              onUpload={() =>
                openFile(selected === "photo" ? "photo" : "background")
              }
            />
          )}
        </aside>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => {
          onFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </div>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: [T, string][];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex rounded-full border border-black/10 p-0.5 text-sm dark:border-white/15">
      {options.map(([option, label]) => (
        <ModeButton
          key={option}
          pressed={value === option}
          onClick={() => onChange(option)}
        >
          {label}
        </ModeButton>
      ))}
    </div>
  );
}

/** Local crops waiting to upload, keyed by their object URL. URLs are revoked on unmount. */
function useStagedBlobs() {
  const blobs = useRef(new Map<string, Blob>());

  useEffect(() => {
    const current = blobs.current;
    return () => {
      for (const url of current.keys()) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  return {
    add(blob: Blob) {
      const url = URL.createObjectURL(blob);
      blobs.current.set(url, blob);
      return url;
    },
    get(url: string | null) {
      return url ? blobs.current.get(url) : undefined;
    },
  };
}
