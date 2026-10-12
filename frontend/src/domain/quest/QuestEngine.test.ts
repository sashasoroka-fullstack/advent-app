import { describe, expect, it } from "vitest";
import { QuestEngine } from "./QuestEngine";
import type { QuestRowData, QuestTaskPosition } from "./types";
import { finishScreenTypes } from "../../constants";
import { questConfig } from "../../config";

function makeRow(
  overrides: Record<string, string | number | null> = {},
): QuestRowData {
  return {
    "Email Address": "alice@leobit.co",
    "Ім'я та прізвище": "Alice Example",
    "Соц мережі відмітки": 2,
    "1. Список справ": 1,
    "2. Пункт зі списку": 1,
    "3. Прогулянка на свіжому повітрі": null,
    ...overrides,
  } as unknown as QuestRowData;
}

describe("QuestEngine", () => {
  const engine = new QuestEngine();

  describe("getUserProgress", () => {
    it("returns null for an invalid email", () => {
      expect(
        engine.getUserProgress(makeRow({ "Email Address": "not-an-email" })),
      ).toBeNull();
    });

    it("counts completed numbered task columns", () => {
      const progress = engine.getUserProgress(makeRow());
      expect(progress).toMatchObject({
        id: "alice",
        email: "alice@leobit.co",
        name: "Alice Example",
        taskNumber: 2,
        socialNetworkPoint: 2,
      });
    });

    it("falls back to the email local-part when the name is empty", () => {
      const progress = engine.getUserProgress(
        makeRow({ "Ім'я та прізвище": "   " }),
      );
      expect(progress?.name).toBe("alice");
    });
  });

  describe("visibility and finish screens", () => {
    it("hides other users still at the start", () => {
      const visible = engine.getVisibleUsers(
        [
          { id: "alice", email: "a@x", name: "A", taskNumber: 0, socialNetworkPoint: 0 },
          { id: "bob", email: "b@x", name: "B", taskNumber: 0, socialNetworkPoint: 0 },
          { id: "cara", email: "c@x", name: "C", taskNumber: 3, socialNetworkPoint: 1 },
        ],
        "alice",
      );
      expect(visible.map((u) => u.id)).toEqual(["alice", "cara"]);
    });

    it("does not show a finish screen for other users", () => {
      expect(
        engine.getFinishState(
          { id: "alice", email: "a@x", name: "A", taskNumber: 9, socialNetworkPoint: 0 },
          false,
        ),
      ).toEqual({ type: "", taskNumber: 0, shouldShow: false });
    });

    it("shows the first finish screen at the first finish task", () => {
      const state = engine.getFinishState(
        {
          id: "alice",
          email: "a@x",
          name: "A",
          taskNumber: questConfig.firstFinishTaskId,
          socialNetworkPoint: 0,
        },
        true,
      );
      expect(state).toEqual({
        type: finishScreenTypes.finish,
        taskNumber: 9,
        shouldShow: true,
      });
    });

    it("shows the dzen screen at the final finish task", () => {
      const state = engine.getFinishState(
        {
          id: "alice",
          email: "a@x",
          name: "A",
          taskNumber: questConfig.finalFinishTaskId,
          socialNetworkPoint: 0,
        },
        true,
      );
      expect(state.type).toBe(finishScreenTypes.dzen);
      expect(state.shouldShow).toBe(true);
    });
  });

  describe("groupUsersByPosition", () => {
    it("places visible users on matching steps and builds avatar URLs", () => {
      const positions = [
        { taskNumber: 0, users: [] },
        { taskNumber: 2, users: [] },
      ] as unknown as Partial<QuestTaskPosition>[];

      const grouped = engine.groupUsersByPosition(
        [
          { id: "alice", email: "alice@leobit.co", name: "Alice", taskNumber: 2, socialNetworkPoint: 1 },
          { id: "bob", email: "bob@leobit.co", name: "Bob", taskNumber: 0, socialNetworkPoint: 0 },
        ],
        "alice",
        positions,
      );

      expect(grouped[0].users).toHaveLength(0);
      expect(grouped[1].users).toEqual([
        expect.objectContaining({
          id: "alice",
          imageUrl: "https://api.employee.leobit.co/photos-small/alice.png",
        }),
      ]);
    });
  });
});
