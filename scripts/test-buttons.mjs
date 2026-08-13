import puppeteer from "puppeteer";
import fs from "fs";

const BASE = "http://localhost:3001";
const SHOT_DIR = "/tmp/flare-screenshots";
fs.mkdirSync(SHOT_DIR, { recursive: true });

const issues = [];
let shotCount = 0;

async function screenshot(page, name) {
  const path = `${SHOT_DIR}/${String(++shotCount).padStart(2, "0")}-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`  📸 ${path}`);
  return path;
}

async function collectConsoleErrors(page) {
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => {
    errors.push(`PAGE ERROR: ${err.message}`);
  });
  return errors;
}

async function getVisibleButtons(page) {
  return await page.evaluate(() => {
    const els = [...document.querySelectorAll("button, [role='button'], a")];
    return els
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && !el.disabled;
      })
      .map((el) => ({
        text: (el.textContent || "").trim().slice(0, 60),
        tag: el.tagName,
        x: Math.round(el.getBoundingClientRect().x),
        y: Math.round(el.getBoundingClientRect().y),
      }));
  });
}

async function clickByText(page, text) {
  return await page.evaluate((searchText) => {
    const els = [...document.querySelectorAll("button, [role='button'], a")];
    const target = els.find((el) => el.textContent.trim().includes(searchText) && !el.disabled);
    if (target) {
      target.scrollIntoView({ block: "center" });
      target.click();
      return true;
    }
    return false;
  }, text);
}

async function checkScreenForIssues(page, screenName) {
  // Check for real error messages (not price changes)
  const screenErrors = await page.evaluate(() => {
    const errorEls = [...document.querySelectorAll("[class*='text-terminal-red']")];
    return errorEls
      .map((el) => el.textContent.trim().slice(0, 150))
      .filter((t) => /ERROR|Error:|failed|Failed|REVERT|revert|exception|undefined is not/i.test(t));
  });
  if (screenErrors.length > 0) {
    console.log(`    ⚠️  Errors: ${screenErrors}`);
    issues.push({ screen: screenName, issue: screenErrors.join("; ") });
  }

  // Check for blank/empty panels
  const blankCheck = await page.evaluate(() => {
    const panels = [...document.querySelectorAll(".terminal-panel")];
    const visible = panels.filter((p) => p.getBoundingClientRect().height > 50);
    const results = [];
    for (const p of visible) {
      const text = p.textContent.trim();
      const rect = p.getBoundingClientRect();
      if (text.length < 15) {
        results.push(`Panel at (${rect.x.toFixed(0)},${rect.y.toFixed(0)}) ${rect.width.toFixed(0)}x${rect.height.toFixed(0)} has minimal text: "${text}"`);
      }
    }
    return results;
  });
  if (blankCheck.length > 0) {
    blankCheck.forEach((b) => {
      console.log(`    ⚠️  ${b}`);
      issues.push({ screen: screenName, issue: b });
    });
  }

  // Check for disabled buttons
  const disabledButtons = await page.evaluate(() => {
    const btns = [...document.querySelectorAll("button")];
    return btns
      .filter((b) => b.disabled && b.getBoundingClientRect().width > 0)
      .map((b) => b.textContent.trim().slice(0, 40))
      .filter(Boolean);
  });
  if (disabledButtons.length > 0) {
    console.log(`    Disabled buttons: ${disabledButtons.join(", ")}`);
  }

  // Check for clipped/overflowing content
  const overflowCheck = await page.evaluate(() => {
    const panels = [...document.querySelectorAll(".terminal-panel")];
    const issues = [];
    for (const p of panels) {
      const inner = p.querySelector(".terminal-content, .overflow-auto");
      if (inner) {
        const pRect = p.getBoundingClientRect();
        const iRect = inner.getBoundingClientRect();
        if (iRect.height > pRect.height + 5 && !inner.style.overflow) {
          issues.push(`Content overflow in panel at (${pRect.x.toFixed(0)},${pRect.y.toFixed(0)})`);
        }
      }
    }
    return issues;
  });
  if (overflowCheck.length > 0) {
    overflowCheck.forEach((o) => {
      console.log(`    ⚠️  ${o}`);
      issues.push({ screen: screenName, issue: o });
    });
  }
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1400,900"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  const consoleErrors = await collectConsoleErrors(page);

  console.log("\n=== 1. INITIAL LOAD ===");
  await page.goto(BASE, { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 3000));
  await screenshot(page, "initial-load");

  const initialButtons = await getVisibleButtons(page);
  console.log(`  Found ${initialButtons.length} visible buttons/links`);
  initialButtons.forEach((b) => console.log(`    [${b.tag}] "${b.text}" at (${b.x},${b.y})`));

  await checkScreenForIssues(page, "initial-load");

  // Get all function keys
  const funcKeys = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll("button")];
    return buttons
      .filter((b) => /^F\d+/.test(b.textContent.trim()) || /^S\+/.test(b.textContent.trim()))
      .map((b) => ({ text: b.textContent.trim(), disabled: b.disabled }))
      .filter((k) => !k.disabled);
  });

  console.log(`\n=== 2. FUNCTION KEYS (${funcKeys.length}) ===`);

  for (const key of funcKeys) {
    const label = key.text.replace(/\s/g, "-");
    console.log(`\n  --- Pressing ${key.text} ---`);
    const clicked = await clickByText(page, key.text);
    if (!clicked) {
      console.log(`    Could not click ${key.text}`);
      issues.push({ screen: `func-${label}`, issue: "Could not click button" });
      continue;
    }
    await new Promise((r) => setTimeout(r, 2500));
    await screenshot(page, `func-${label}`);
    await checkScreenForIssues(page, `func-${label}`);

    // Log what's visible now
    const panelInfo = await page.evaluate(() => {
      const panels = [...document.querySelectorAll(".terminal-panel")];
      return panels
        .filter((p) => p.getBoundingClientRect().height > 50)
        .map((p) => p.textContent.trim().slice(0, 60));
    });
    console.log(`    Active panels: ${panelInfo.length}`);
    panelInfo.forEach((p, i) => console.log(`      ${i}: "${p}"`));
  }

  console.log("\n=== 3. COMMAND LINE ===");
  const cmdInput = await page.$("input[placeholder*='COMMAND'], input[placeholder*='command']");
  if (cmdInput) {
    for (const cmd of ["HELP", "ABOUT", "MARKET", "ATM", "TRADE", "WALLET", "CLEAR"]) {
      await cmdInput.click();
      await page.evaluate(() => {
        const input = document.querySelector("input[placeholder*='COMMAND'], input[placeholder*='command']");
        if (input) input.value = "";
      });
      await cmdInput.type(cmd);
      await page.keyboard.press("Enter");
      await new Promise((r) => setTimeout(r, 1500));
      await screenshot(page, `cmd-${cmd.toLowerCase()}`);
      await checkScreenForIssues(page, `cmd-${cmd}`);
      console.log(`  Ran: ${cmd}`);
    }
  } else {
    console.log("  ⚠️  Command line input not found");
    issues.push({ screen: "command-line", issue: "Input not found" });
  }

  console.log("\n=== 4. ADD COLUMN ===");
  const addColClicked = await clickByText(page, "+COL");
  if (addColClicked) {
    await new Promise((r) => setTimeout(r, 1000));
    await screenshot(page, "add-column");
    console.log("  Clicked + COL");
  } else {
    console.log("  ⚠️  + COL button not found");
    issues.push({ screen: "add-column", issue: "Button not found" });
  }

  console.log("\n=== 5. RESET LAYOUT ===");
  const resetClicked = await clickByText(page, "S+R");
  if (resetClicked) {
    await new Promise((r) => setTimeout(r, 1000));
    await screenshot(page, "reset-layout");
    console.log("  Clicked S+R RESET");
  }

  console.log("\n=== 6. CONSOLE ERRORS ===");
  if (consoleErrors.length > 0) {
    console.log(`  ⚠️  ${consoleErrors.length} console errors:`);
    [...new Set(consoleErrors)].forEach((e) => console.log(`    ${e.slice(0, 200)}`));
    issues.push({ screen: "console", issue: `${consoleErrors.length} console errors (see logs)` });
  } else {
    console.log("  No console errors ✓");
  }

  console.log("\n=== 7. MOBILE VIEW (390x844) ===");
  await page.setViewport({ width: 390, height: 844 });
  await new Promise((r) => setTimeout(r, 2000));
  await screenshot(page, "mobile-view");

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  console.log(`  Scroll: ${overflow.scrollWidth}px vs viewport: ${overflow.clientWidth}px`);
  if (overflow.scrollWidth > overflow.clientWidth + 5) {
    console.log(`  ⚠️  Horizontal overflow: ${overflow.scrollWidth - overflow.clientWidth}px`);
    issues.push({ screen: "mobile", issue: `Horizontal overflow of ${overflow.scrollWidth - overflow.clientWidth}px` });
  }

  // Test function keys on mobile
  const mobileFuncKeys = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll("button")];
    return buttons
      .filter((b) => /^F\d+/.test(b.textContent.trim()) && !b.disabled)
      .map((b) => ({
        text: b.textContent.trim(),
        rect: { x: b.getBoundingClientRect().x, w: b.getBoundingClientRect().width },
      }));
  });
  console.log(`  Mobile function keys visible: ${mobileFuncKeys.length}`);
  // Check if function bar is scrollable or clipped
  const funcBarRect = await page.evaluate(() => {
    const bar = document.querySelector("[class*='function-bar'], [class*='FunctionBar']");
    if (!bar) return null;
    const r = bar.getBoundingClientRect();
    return { x: r.x, w: r.width, scrollW: bar.scrollWidth };
  });
  if (funcBarRect && funcBarRect.scrollW > funcBarRect.w) {
    console.log(`  Function bar scrollable: ${funcBarRect.scrollW - funcBarRect.w}px overflow (OK if scrollable)`);
  }

  // Press F2 (ATM) on mobile
  await clickByText(page, "F2");
  await new Promise((r) => setTimeout(r, 2000));
  await screenshot(page, "mobile-atm");
  await checkScreenForIssues(page, "mobile-atm");

  // Reset viewport
  await page.setViewport({ width: 1400, height: 900 });
  await new Promise((r) => setTimeout(r, 1000));

  console.log("\n=== 8. THEME TOGGLE ===");
  await clickByText(page, "THEME");
  await new Promise((r) => setTimeout(r, 1500));
  await screenshot(page, "theme-light");
  console.log("  Toggled to light theme");
  await checkScreenForIssues(page, "theme-light");

  // Toggle back
  await clickByText(page, "THEME");
  await new Promise((r) => setTimeout(r, 1000));

  console.log("\n=== 9. PANEL + BUTTONS ===");
  // Click + buttons to add panels
  const plusButtons = await page.$$('button:has(+)');
  // Try clicking + buttons by position
  const plusClicked = await page.evaluate(() => {
    const btns = [...document.querySelectorAll("button")];
    const plus = btns.find((b) => b.textContent.trim() === "+" && b.getBoundingClientRect().width < 30);
    if (plus) {
      plus.click();
      return true;
    }
    return false;
  });
  if (plusClicked) {
    await new Promise((r) => setTimeout(r, 1500));
    await screenshot(page, "panel-added");
    console.log("  Clicked + to add panel");
  }

  console.log("\n=== SUMMARY ===");
  console.log(`Screenshots: ${shotCount} in ${SHOT_DIR}/`);
  if (issues.length === 0) {
    console.log("\n✅ No issues found!");
  } else {
    console.log(`\n⚠️  ${issues.length} issue(s) found:`);
    issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. [${issue.screen}] ${issue.issue}`);
    });
  }

  // Write issues to file
  fs.writeFileSync(
    "/tmp/flare-screenshots/issues.json",
    JSON.stringify(issues, null, 2)
  );

  await browser.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
