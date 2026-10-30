import "fake-indexeddb/auto";
import { afterAll, expect, it } from "vitest";
import Dexie from "dexie";
import { defaults } from "../processing/adjustments";
it("migrates v1 presets without losing data and persists custom palettes", async () => {
  const old = new Dexie("lightdna");
  old.version(1).stores({ presets: "++id,name" });
  await old
    .table("presets")
    .add({
      name: "Legacy warm",
      params: {
        strength: 70,
        exposure: 0,
        contrast: 12,
        saturation: 0,
        warmth: 15,
        shadows: 0,
        highlights: 0,
      },
    });
  old.close();
  const { db, useEditor } = await import("../store");
  const saved = await db.presets.toArray();
  expect(saved[0].name).toBe("Legacy warm");
  useEditor.getState().apply(saved[0].params);
  expect(useEditor.getState().params).toEqual({
    ...defaults,
    contrast: 12,
    warmth: 15,
  });
  const id = await db.palettes.add({
    name: "Test palette",
    colors: ["#123456", "#abcdef"],
  });
  await db.palettes.update(id, { name: "Renamed" });
  expect((await db.palettes.get(id))?.name).toBe("Renamed");
  await db.palettes.delete(id);
  expect(await db.palettes.count()).toBe(0);
  db.close();
});
afterAll(async () => {
  await Dexie.delete("lightdna");
});
