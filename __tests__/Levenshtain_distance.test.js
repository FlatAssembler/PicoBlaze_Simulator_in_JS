const tree = require("../TreeNode.js");
global.LevenshtainDistance=tree.LevenshtainDistance;


describe("Evaluation of Levenshtain Distance", () => {
  test("Two empty strings", () => {
    expect(LevenshtainDistance("","")).toEqual(
      0,
    );
  });
  test("Empty string and a non-emtpy string", () => {
    expect(LevenshtainDistance("","ABC")).toEqual(
      3,
    );
  });
  test("The \"kitten\"-\"sitting\" test", () => { // https://en.wikipedia.org/wiki/Levenshtein_distance#Example
    expect(LevenshtainDistance("kitten","sitting")).toEqual(
      3,
    );
  });
});
