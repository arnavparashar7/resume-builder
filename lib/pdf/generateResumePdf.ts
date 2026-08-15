import { chromium } from "playwright";

// ============================================================================
// PDF generation
// ----------------------------------------------------------------------------
// Renders a resume to PDF by pointing a headless Chromium at the app's own
// `/print/[id]` route (see app/print/[id]/page.tsx) and calling page.pdf().
// That route renders the SAME template component used by the live preview
// (components/preview/ResumePreview.tsx) - nothing here re-implements resume
// layout, which is exactly what keeps the exported PDF matching the preview.
//
// Margins are left at 0 here because the template itself already has its
// print margins baked into its CSS (see templates/classic/classic.css's
// `.classic-page` padding) - adding page.pdf() margins on top would double
// them up.
// ============================================================================

export async function generateResumePdf(printUrl: string): Promise<Buffer> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(printUrl, { waitUntil: "networkidle" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      // Left/right are 0 here because the template's own CSS already pads
      // horizontally (see classic.css) - that padding is reliably present
      // on every page since it's a single block's inline padding. Top/bottom
      // margin, on the other hand, MUST be supplied here rather than via
      // container padding, because page.pdf() repeats this margin on every
      // resulting page, while container padding only appears once at the
      // very start/end of the content flow. Keep this value in sync with
      // classic.css's `@media screen` padding-top/bottom so the preview and
      // the PDF look the same.
      margin: { top: "14mm", right: "0mm", bottom: "14mm", left: "0mm" },
    });
    return pdf;
  } finally {
    await browser.close();
  }
}
