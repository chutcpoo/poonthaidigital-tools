import { zipSync, strToU8 } from 'fflate';

const esc = value => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const col = n => {
  let s = '';
  while (n > 0) { n--; s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26); }
  return s;
};

function cell(ref, value, style = 0, formula = null) {
  const s = style ? ` s="${style}"` : '';
  if (formula) return `<c r="${ref}"${s}><f>${esc(formula)}</f><v></v></c>`;
  if (typeof value === 'number') return `<c r="${ref}"${s}><v>${value}</v></c>`;
  return `<c r="${ref}" t="inlineStr"${s}><is><t xml:space="preserve">${esc(value)}</t></is></c>`;
}

function rowXml(rowNum, values, styles = [], formulas = {}) {
  const cells = values.map((v, i) => cell(`${col(i + 1)}${rowNum}`, v, styles[i] || 0, formulas[i] || null)).join('');
  return `<row r="${rowNum}">${cells}</row>`;
}

const CORE = {
  inventory: ['Create a small item list','Record current quantity','Record average daily use','Set lead time in days','Set safety stock','Calculate reorder point','Compare current stock to reorder point','Flag items to review','Add supplier notes','Review once per week'],
  waste: ['List wasted items','Enter quantity wasted','Enter unit cost','Calculate waste cost','Add reason','Add date','Group repeated causes','Review daily total','Review weekly total','Choose one corrective action'],
  bakery: ['Choose a bake day','Enter available production minutes','List products','Enter batch size','Enter minutes per batch','Enter order quantity','Calculate batches needed','Calculate required minutes','Compare required vs available time','Flag over-capacity days'],
  boba: ['Opening readiness check','Equipment check','Prep priority list','Ingredient par check','Cleaning check','Stock note','Waste note','Cash handoff note','Closing check','Next-shift handoff note'],
  restaurant: ['Opening facility check','Opening equipment check','Pre-service readiness','Prep check','Temperature note','Cleaning check','Service issue note','Closing check','Manager verification','Shift handoff'],
  coffee: ['Unlock / facility check','Espresso machine readiness','Brew setup','Prep priority','Cleaning readiness','Stock spot-check','Cash / POS readiness','Opening sign-off','Closing reset','Shift handoff'],
  cleaning: ['List cleaning tasks','Choose frequency','Assign owner','Set due day','Mark complete','Add verification','Record issue','Record corrective action','Review weekly misses','Adjust next cycle'],
  invoice: ['List open invoices','Record invoice and due dates','Record invoice amount','Record payments received','Review remaining balance','Check overdue age','Record last follow-up','Set next follow-up','Record promise-to-pay details','Choose the next action'],
  chef: ['Set basic business assumptions','Record client details','Create service record','Choose menu / service idea','Estimate food / material cost','Estimate labor / travel / add-ons','Build a quote','Create service plan','Create shopping / prep list','Record actuals and payments']
};

function specializedRows(cfg) {
  if (cfg.kind === 'inventory') {
    const rows = [rowXml(4, ['Item','Current Qty','Avg Daily Use','Lead Time (days)','Safety Stock','Reorder Point','Status'], [2,2,2,2,2,2,2])];
    for (let r = 5; r <= 14; r++) rows.push(rowXml(r, [`Item ${r-4}`,'','','','','',''], [0,3,3,3,3,0,0], {5:`C${r}*D${r}+E${r}`,6:`IF(B${r}<=F${r},"REVIEW / REORDER","OK")`}));
    return { rows, maxCol: 7 };
  }
  if (cfg.kind === 'waste') {
    const rows = [rowXml(4, ['Date','Item','Qty Wasted','Unit Cost','Waste Cost','Reason','Corrective Action'], [2,2,2,2,2,2,2])];
    for (let r = 5; r <= 14; r++) rows.push(rowXml(r, ['','','','','','',''], [3,3,3,3,0,3,3], {4:`C${r}*D${r}`}));
    rows.push(rowXml(16, ['','','','Total Waste Cost','','',''], [0,0,0,2,0,0,0], {4:'SUM(E5:E14)'}));
    return { rows, maxCol: 7 };
  }
  if (cfg.kind === 'invoice') {
    const rows = [rowXml(4, ['Invoice ID','Client','Invoice Date','Due Date','Invoice Amount','Paid','Balance','Days Overdue','Status','Last Follow-Up','Next Follow-Up','Promise to Pay','Next Action'], [2,2,2,2,2,2,2,2,2,2,2,2,2])];
    for (let r = 5; r <= 12; r++) rows.push(rowXml(r, [`INV-${String(r-4).padStart(3,'0')}`,'','','','','','','','','','','',''], [0,3,3,3,3,3,0,0,0,3,3,3,3], {
      6:`MAX(0,E${r}-F${r})`,
      7:`IF(G${r}=0,0,MAX(0,TODAY()-D${r}))`,
      8:`IF(G${r}=0,"PAID",IF(D${r}="","ADD DUE DATE",IF(TODAY()<D${r},"CURRENT",IF(TODAY()=D${r},"DUE TODAY","OVERDUE"))))`
    }));
    return { rows, maxCol: 13 };
  }
  if (cfg.kind === 'bakery') {
    const rows = [rowXml(3, ['Available production minutes',480,'','','','',''], [2,3,0,0,0,0,0]), rowXml(5, ['Product','Order Qty','Units / Batch','Min / Batch','Batches Needed','Required Min','Capacity Status'], [2,2,2,2,2,2,2])];
    for (let r = 6; r <= 15; r++) rows.push(rowXml(r, [`Product ${r-5}`,'','','','','',''], [0,3,3,3,0,0,0], {4:`ROUNDUP(B${r}/C${r},0)`,5:`E${r}*D${r}`,6:`IF(SUM($F$6:F${r})<=$B$3,"WITHIN CAPACITY","OVER CAPACITY")`}));
    return { rows, maxCol: 7 };
  }
  const headers = ['Step','Core workflow','Your input / status','Owner / value','Notes','Full-version connection'];
  const rows = [rowXml(4, headers, [2,2,2,2,2,2])];
  CORE[cfg.kind].forEach((task, i) => rows.push(rowXml(i + 5, [i + 1, task,'','','','Free core workflow'], [0,0,3,3,3,0])));
  return { rows, maxCol: 6 };
}

export function buildStarterXlsx(cfg) {
  const spec = specializedRows(cfg);
  const maxColLetter = col(spec.maxCol);
  const title = rowXml(1, [cfg.starterName, ...Array(spec.maxCol - 1).fill('')], [1]);
  const sub = rowXml(2, ['Free starter — use this first. Upgrade only when the advanced workflow solves a real need.', ...Array(spec.maxCol - 1).fill('')], [5]);
  const advancedStart = cfg.kind === 'bakery' ? 18 : (cfg.kind === 'waste' ? 19 : 17);
  const adv1 = rowXml(advancedStart, ['11', cfg.advanced1, 'Advanced / paid use', '', '', cfg.paidName, ...(spec.maxCol > 6 ? [''] : [])], [4,4,4,4,4,4,4].slice(0,spec.maxCol));
  const adv2 = rowXml(advancedStart + 1, ['12', cfg.advanced2, 'Advanced / paid use', '', '', cfg.paidName, ...(spec.maxCol > 6 ? [''] : [])], [4,4,4,4,4,4,4].slice(0,spec.maxCol));
  const note = rowXml(advancedStart + 3, ['If your free starter already handles the job, keep using it. The full Etsy version is for repeatable, connected or team-based workflows.', ...Array(spec.maxCol - 1).fill('')], [5]);

  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${maxColLetter}${advancedStart+3}"/><sheetViews><sheetView workbookViewId="0"/></sheetViews><cols>${Array.from({length:spec.maxCol},(_,i)=>`<col min="${i+1}" max="${i+1}" width="${i===1?34:(i>=4?22:18)}" customWidth="1"/>`).join('')}</cols><sheetData>${title}${sub}${spec.rows.join('')}${adv1}${adv2}${note}</sheetData><mergeCells count="3"><mergeCell ref="A1:${maxColLetter}1"/><mergeCell ref="A2:${maxColLetter}2"/><mergeCell ref="A${advancedStart+3}:${maxColLetter}${advancedStart+3}"/></mergeCells></worksheet>`;

  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="3"><font><sz val="11"/><name val="Aptos"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="16"/><name val="Aptos"/></font><font><b/><color rgb="FFFFFFFF"/><name val="Aptos"/></font></fonts><fills count="6"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF16324F"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2B6F70"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF4CC"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFD89B3C"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="2" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="0" fillId="4" borderId="0" xfId="0" applyFill="1"/><xf numFmtId="0" fontId="0" fillId="5" borderId="0" xfId="0" applyFill="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

  const files = {
    '[Content_Types].xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`),
    '_rels/.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    'xl/workbook.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="STARTER" sheetId="1" r:id="rId1"/></sheets><calcPr calcId="191029" fullCalcOnLoad="1" forceFullCalc="1"/></workbook>`),
    'xl/_rels/workbook.xml.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`),
    'xl/worksheets/sheet1.xml': strToU8(sheet),
    'xl/styles.xml': strToU8(styles)
  };
  return Buffer.from(zipSync(files, { level: 6 }));
}
