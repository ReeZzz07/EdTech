import { describe, expect, it } from "vitest";
import { skillLabelFromSubjectMap } from "./skills";

describe("skillLabelFromSubjectMap", () => {
  it("без массива возвращает skillId", () => {
    expect(skillLabelFromSubjectMap(null, "x")).toBe("x");
    expect(skillLabelFromSubjectMap({}, "x")).toBe("x");
  });

  it("находит label по skillId", () => {
    const map = [
      { skillId: "a", label: "Алгебра" },
      { skillId: "b", label: "Геометрия" },
    ];
    expect(skillLabelFromSubjectMap(map, "b")).toBe("Геометрия");
  });

  it("пустой label откатывает к skillId", () => {
    expect(skillLabelFromSubjectMap([{ skillId: "a", label: "  " }], "a")).toBe("a");
  });
});
