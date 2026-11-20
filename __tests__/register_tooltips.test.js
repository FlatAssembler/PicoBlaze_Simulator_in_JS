const headerScript = require("../headerScript.js");

describe("Register name tooltips", () => {
  test("makes alternative register names available on focus", () => {
    const tableHeader = document.createElement("th");
    tableHeader.innerHTML =
        headerScript.formatRegisterHeader(10, [ "stack_pointer", "sp" ]);

    const registerName = tableHeader.querySelector("abbr");
    expect(registerName.textContent).toBe("sa");
    expect(registerName.getAttribute("title")).toBe("stack_pointer, sp");
    expect(registerName.getAttribute("tabindex")).toBe("0");
  });

  test("leaves unnamed registers without a tooltip", () => {
    expect(headerScript.formatRegisterHeader(10, [])).toBe("sa");
  });
});
