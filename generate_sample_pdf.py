"""Generate a sample ROS (Recipe of Synthesis) PDF for testing the AI Should Cost Engine."""

import struct

def make_pdf(filename: str, pages: list[list[str]]) -> None:
    """Build a minimal but valid PDF with text content."""
    objects = []

    # For each page, build a content stream
    page_refs = []
    content_refs = []

    for page_lines in pages:
        # Build BT...ET stream
        lines_pdf = []
        lines_pdf.append("BT")
        lines_pdf.append("/F1 10 Tf")
        lines_pdf.append("50 760 Td")
        lines_pdf.append("12 TL")  # line height
        for line in page_lines:
            # Escape special PDF string chars
            safe = line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)").replace("\r", "")
            lines_pdf.append(f"({safe}) Tj T*")
        lines_pdf.append("ET")
        stream_content = "\n".join(lines_pdf).encode("latin-1", errors="replace")

        content_obj_idx = len(objects) + 1  # 1-based
        objects.append(("stream", stream_content))
        content_refs.append(content_obj_idx)

    # Now build page objects
    for i, content_ref in enumerate(content_refs):
        page_obj_idx = len(objects) + 1
        objects.append(("page", content_ref))
        page_refs.append(page_obj_idx)

    # Pages dict
    pages_obj_idx = len(objects) + 1
    objects.append(("pages", page_refs))

    # Catalog
    catalog_obj_idx = len(objects) + 1
    objects.append(("catalog", pages_obj_idx))

    # Font
    font_obj_idx = len(objects) + 1
    objects.append(("font",))

    # --- now serialize ---
    body = b"%PDF-1.4\n"
    offsets = []

    obj_num = 1
    for obj in objects:
        offsets.append(len(body))
        kind = obj[0]

        if kind == "stream":
            content = obj[1]
            body += f"{obj_num} 0 obj\n<< /Length {len(content)} >>\nstream\n".encode()
            body += content + b"\nendstream\nendobj\n"

        elif kind == "page":
            content_ref = obj[1]
            body += (
                f"{obj_num} 0 obj\n"
                f"<< /Type /Page /Parent {pages_obj_idx} 0 R "
                f"/MediaBox [0 0 612 792] "
                f"/Contents {content_ref} 0 R "
                f"/Resources << /Font << /F1 {font_obj_idx} 0 R >> >> >>\n"
                f"endobj\n"
            ).encode()

        elif kind == "pages":
            kids = " ".join(f"{r} 0 R" for r in obj[1])
            body += (
                f"{obj_num} 0 obj\n"
                f"<< /Type /Pages /Kids [{kids}] /Count {len(obj[1])} >>\n"
                f"endobj\n"
            ).encode()

        elif kind == "catalog":
            body += (
                f"{obj_num} 0 obj\n"
                f"<< /Type /Catalog /Pages {obj[1]} 0 R >>\n"
                f"endobj\n"
            ).encode()

        elif kind == "font":
            body += (
                f"{obj_num} 0 obj\n"
                f"<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\n"
                f"endobj\n"
            ).encode()

        obj_num += 1

    # xref
    xref_offset = len(body)
    total_objs = len(objects) + 1
    body += f"xref\n0 {total_objs}\n".encode()
    body += b"0000000000 65535 f \n"
    for off in offsets:
        body += f"{off:010d} 00000 n \n".encode()

    body += (
        f"trailer\n<< /Size {total_objs} /Root {catalog_obj_idx} 0 R >>\n"
        f"startxref\n{xref_offset}\n%%EOF\n"
    ).encode()

    with open(filename, "wb") as f:
        f.write(body)
    print(f"Created: {filename}")


# ── Sample ROS Document Content ──────────────────────────────────────────────

PAGE1 = [
    "================================================================",
    "  RECIPE OF SYNTHESIS (ROS) - CONFIDENTIAL",
    "  Product: Lupin-API-01 (Active Pharmaceutical Ingredient)",
    "  Batch Size: 10 kg",
    "  Document No: ROS-2024-0042  Rev: 2",
    "  Prepared by: Process Chemistry  Date: 2024-01-15",
    "================================================================",
    "",
    "1. PRODUCT INFORMATION",
    "   Product Name    : Lupin-API-01 (Paracetamol intermediate)",
    "   CAS Number      : 103-90-2",
    "   Molecular Weight: 151.16 g/mol",
    "   Purity Target   : >= 99.5% HPLC",
    "   Batch Size      : 10 kg finished product",
    "",
    "2. RAW MATERIALS & REAGENTS",
    "   ---------------------------------------------------------------",
    "   Material              | Qty (per batch) | Unit | Grade",
    "   ---------------------------------------------------------------",
    "   4-Aminophenol         | 12.5 kg         | kg   | USP/BP",
    "   Acetic Anhydride      | 11.8 kg         | kg   | Technical",
    "   Activated Charcoal    | 0.25 kg         | kg   | Pharmaceutical",
    "   Sodium Hydroxide      | 1.2 kg          | kg   | AR Grade",
    "   Hydrochloric Acid     | 0.8 kg          | kg   | AR Grade",
    "   ---------------------------------------------------------------",
    "",
    "3. SOLVENTS",
    "   ---------------------------------------------------------------",
    "   Solvent               | Volume (L)  | Recovery Expected",
    "   ---------------------------------------------------------------",
    "   Purified Water        | 80 L        | Non-recoverable",
    "   Ethanol (96%)         | 40 L        | 75% recovery expected",
    "   Acetone               | 20 L        | 80% recovery expected",
    "   ---------------------------------------------------------------",
    "",
    "4. PROCESS STEPS",
    "   Step 1 - Acetylation Reaction (Duration: 3 hrs)",
    "     - Charge 4-Aminophenol (12.5 kg) to reactor R-101",
    "     - Add Purified Water (40 L), heat to 60 deg C",
    "     - Slowly add Acetic Anhydride (11.8 kg) over 90 min",
    "     - Maintain at 60 deg C for 60 min (reaction completion)",
    "     - Labor: 2 operators x 3 hrs = 6 operator-hours",
    "",
    "   Step 2 - Crystallization (Duration: 4 hrs)",
    "     - Cool reaction mass to 10 deg C over 2 hrs",
    "     - Filter the crystals using centrifuge CF-201",
    "     - Wash with cold Purified Water (20 L)",
    "     - Collect mother liquor for solvent recovery",
    "     - Labor: 2 operators x 4 hrs = 8 operator-hours",
]

PAGE2 = [
    "   Step 3 - Purification / Decolorization (Duration: 2 hrs)",
    "     - Dissolve crude crystals in Ethanol (40 L) at 50 deg C",
    "     - Add Activated Charcoal (0.25 kg), stir 30 min",
    "     - Filter through Sparkler Filter SF-101",
    "     - Labor: 1 operator x 2 hrs = 2 operator-hours",
    "",
    "   Step 4 - Final Crystallization & Drying (Duration: 6 hrs)",
    "     - Cool filtrate to 5 deg C, collect crystals",
    "     - Wash with Acetone (20 L), centrifuge",
    "     - Dry in Fluid Bed Dryer FBD-301 at 60 deg C for 3 hrs",
    "     - Labor: 2 operators x 6 hrs = 12 operator-hours",
    "     - Utility: Steam 150 kg, Power 45 kWh",
    "",
    "   Step 5 - Milling & Blending (Duration: 1 hr)",
    "     - Mill dried product to D90 < 50 micron",
    "     - Blend in IBC-201, sample for QC",
    "     - Labor: 1 operator x 1 hr = 1 operator-hour",
    "",
    "5. EQUIPMENT LIST",
    "   Reactor R-101        : 200L jacketed glass-lined reactor",
    "   Centrifuge CF-201    : Sigma 6-16 pharma centrifuge",
    "   Sparkler Filter SF-101: 12-plate stainless steel",
    "   Fluid Bed Dryer FBD-301: 50 kg capacity",
    "   Pin Mill PM-401      : 5 kg/hr capacity",
    "",
    "6. UTILITIES CONSUMPTION (per batch)",
    "   Steam               : 200 kg   @ $0.03/kg  = $6.00",
    "   Power (electricity) : 120 kWh  @ $0.10/kWh = $12.00",
    "   Cooling Water       : 5000 L   @ $0.001/L  = $5.00",
    "   Nitrogen (purging)  : 50 m3    @ $0.50/m3  = $25.00",
    "",
    "7. QUALITY CONTROL",
    "   In-process tests: pH, assay by HPLC, moisture by KF",
    "   Final release    : Identity, Assay, Related substances,",
    "                      Residual solvents, Heavy metals",
    "   QC Labor         : 4 analyst-hours per batch",
    "",
    "8. YIELD SUMMARY",
    "   Theoretical yield : 13.5 kg (based on stoichiometry)",
    "   Expected yield    : 10.0 kg (~74% of theoretical)",
    "   Specification     : >= 9.5 kg acceptable batch",
    "",
    "9. WASTE & ENVIRONMENTAL",
    "   Aqueous waste     : ~60 L (pH adjust, discharge to ETP)",
    "   Organic solvent   : ~15 L residual (incinerate)",
    "   Solid waste       : ~0.5 kg charcoal cake (landfill)",
    "",
    "10. NOTES",
    "    - All reagent costs based on Q1-2024 contracted prices",
    "    - Labor rate assumed: $25/operator-hour (New Jersey, USA)",
    "    - Overhead rate: 150% of direct labor",
    "    - Manufacturing location: New Jersey, USA",
    "================================================================",
    "  END OF DOCUMENT",
    "================================================================",
]

if __name__ == "__main__":
    make_pdf("sample_ros_document.pdf", [PAGE1, PAGE2])
    print("Sample ROS PDF created successfully.")
    print("Upload this file to test the AI Should Cost Engine.")
