const {
  filterItems,
} = require("../../../../src/adapters/in-memory/utils/filter");

describe("filter", () => {
  const items = [
    {
      category: "books",
      status: "active",
      description: "A book about TypeScript",
    },
    { category: "books", status: "inactive" },
    {
      category: "electronics",
      status: "active",
      description: "A guide to electronics",
    },
    {
      category: "electronics",
      status: "inactive",
      description: "Outdated model",
    },
  ];

  test("filters items with a given property value", () => {
    const result = filterItems(items, "category:books");
    expect(result).toEqual([
      {
        category: "books",
        status: "active",
        description: "A book about TypeScript",
      },
      { category: "books", status: "inactive" },
    ]);
  });

  test("filters out items with a negated property value", () => {
    const result = filterItems(items, "-status:inactive");
    expect(result).toEqual([
      {
        category: "books",
        status: "active",
        description: "A book about TypeScript",
      },
      {
        category: "electronics",
        status: "active",
        description: "A guide to electronics",
      },
    ]);
  });

  test("returns all items when the query is empty", () => {
    const result = filterItems(items, "");
    expect(result).toEqual(items);
  });

  test("filters items where a property exists", () => {
    const result = filterItems(items, "_exists_:description");
    expect(result).toEqual([
      {
        category: "books",
        status: "active",
        description: "A book about TypeScript",
      },
      {
        category: "electronics",
        status: "active",
        description: "A guide to electronics",
      },
      {
        category: "electronics",
        status: "inactive",
        description: "Outdated model",
      },
    ]);
  });

  test("filters items where a property does not exist", () => {
    const result = filterItems(items, "-_exists_:description");
    expect(result).toEqual([{ category: "books", status: "inactive" }]);
  });
});
