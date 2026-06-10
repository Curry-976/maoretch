import type { Document, DocumentLine } from "@prisma/client";

type FullDocument = Document & { lines: DocumentLine[] };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function eur(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(n);
}

function frDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Brouillon",
  sent: "Envoyé",
  accepted: "Accepté",
  paid: "Payé",
  cancelled: "Annulé",
};

/** Build a fully-inline-styled HTML email body for a document. */
export function renderDocumentEmail(
  doc: FullDocument,
  customMessage?: string,
): { subject: string; html: string } {
  const typeLabel = doc.type === "quote" ? "Devis" : "Facture";
  const subject = `${typeLabel} ${doc.number} — Maore-Tech`;

  const linesHtml = doc.lines
    .map(
      (l) => `
      <tr style="border-bottom:1px solid #e5e2db">
        <td style="padding:14px 0;vertical-align:top">
          <div style="font-weight:500;color:#1a1f36;font-size:14px">${escapeHtml(
            l.label,
          )}</div>
          ${
            l.description
              ? `<div style="color:#6b6f7b;font-size:12px;margin-top:4px">${escapeHtml(l.description)}</div>`
              : ""
          }
        </td>
        <td style="padding:14px 8px;text-align:right;vertical-align:top;color:#1a1f36;font-variant-numeric:tabular-nums;font-size:13px">${l.quantity}</td>
        <td style="padding:14px 8px;text-align:right;vertical-align:top;color:#1a1f36;font-variant-numeric:tabular-nums;font-size:13px">${eur(l.unitPrice)}</td>
        <td style="padding:14px 0;text-align:right;vertical-align:top;color:#1a1f36;font-weight:500;font-variant-numeric:tabular-nums;font-size:13px">${eur(l.total)}</td>
      </tr>`,
    )
    .join("");

  const messageBlock = customMessage
    ? `
      <tr><td style="padding:0 32px 24px 32px">
        <div style="background:#fdfbf5;border:1px solid #e5e2db;border-radius:6px;padding:18px;color:#1a1f36;font-size:14px;line-height:1.6;white-space:pre-wrap">
          ${escapeHtml(customMessage)}
        </div>
      </td></tr>`
    : "";

  const notesBlock = doc.notes
    ? `
      <tr><td style="padding:0 32px 16px 32px">
        <div style="font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#6b6f7b;font-weight:500;margin-bottom:6px">Notes</div>
        <div style="font-size:13px;color:#1a1f36;line-height:1.55;white-space:pre-wrap">${escapeHtml(doc.notes)}</div>
      </td></tr>`
    : "";

  const termsBlock = doc.paymentTerms
    ? `
      <tr><td style="padding:0 32px 24px 32px">
        <div style="font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#6b6f7b;font-weight:500;margin-bottom:6px">Conditions de paiement</div>
        <div style="font-size:13px;color:#1a1f36;line-height:1.55">${escapeHtml(doc.paymentTerms)}</div>
      </td></tr>`
    : "";

  const dueBlock = doc.dueAt
    ? `<div style="color:#6b6f7b;font-size:12px;font-variant-numeric:tabular-nums">Échéance : ${frDate(doc.dueAt)}</div>`
    : "";

  const taxBlock =
    doc.taxRate > 0
      ? `
      <tr>
        <td style="padding:6px 0;color:#6b6f7b;font-size:13px">TVA ${doc.taxRate}%</td>
        <td style="padding:6px 0;text-align:right;color:#1a1f36;font-variant-numeric:tabular-nums;font-size:13px">${eur(doc.taxAmount)}</td>
      </tr>`
      : "";

  const html = `
<!doctype html>
<html lang="fr"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#faf8f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1f36">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f3;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border:1px solid #e5e2db;border-radius:12px;overflow:hidden">

        <!-- Header -->
        <tr><td style="padding:32px 32px 24px 32px;border-bottom:1px solid #e5e2db">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:top">
                <div style="font-size:20px;font-weight:700;color:#1a1f36;letter-spacing:-0.01em">Maore-Tech</div>
                <div style="font-size:11px;color:#6b6f7b;margin-top:4px">Mamoudzou, Mayotte (976)</div>
              </td>
              <td style="vertical-align:top;text-align:right">
                <div style="font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#6b6f7b;font-weight:500">${typeLabel}</div>
                <div style="font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:18px;color:#1a1f36;margin-top:2px;font-variant-numeric:tabular-nums">${doc.number}</div>
                <div style="color:#6b6f7b;font-size:12px;margin-top:6px;font-variant-numeric:tabular-nums">Émis le ${frDate(doc.issuedAt)}</div>
                ${dueBlock}
                <div style="margin-top:8px">
                  <span style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;font-weight:500;background:#1a1f36;color:#ffffff;padding:3px 8px;border-radius:4px">${STATUS_LABEL[doc.status] ?? doc.status}</span>
                </div>
              </td>
            </tr>
          </table>
        </td></tr>

        ${messageBlock}

        <!-- Recipient -->
        <tr><td style="padding:24px 32px 8px 32px">
          <div style="font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#6b6f7b;font-weight:500;margin-bottom:8px">Destinataire</div>
          <div style="font-size:14px;color:#1a1f36;font-weight:500">${escapeHtml(doc.clientName)}</div>
          ${doc.clientAddress ? `<div style="font-size:13px;color:#6b6f7b;margin-top:2px">${escapeHtml(doc.clientAddress)}</div>` : ""}
          ${doc.clientEmail ? `<div style="font-size:13px;color:#6b6f7b;margin-top:2px">${escapeHtml(doc.clientEmail)}</div>` : ""}
          ${doc.clientPhone ? `<div style="font-size:13px;color:#6b6f7b;margin-top:2px;font-variant-numeric:tabular-nums">${escapeHtml(doc.clientPhone)}</div>` : ""}
        </td></tr>

        <!-- Lines -->
        <tr><td style="padding:24px 32px 8px 32px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
            <thead>
              <tr>
                <th align="left" style="padding-bottom:8px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#6b6f7b;font-weight:500;border-bottom:1px solid #e5e2db">Désignation</th>
                <th align="right" style="padding-bottom:8px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#6b6f7b;font-weight:500;border-bottom:1px solid #e5e2db;width:60px">Qté</th>
                <th align="right" style="padding-bottom:8px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#6b6f7b;font-weight:500;border-bottom:1px solid #e5e2db;width:90px">PU</th>
                <th align="right" style="padding-bottom:8px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#6b6f7b;font-weight:500;border-bottom:1px solid #e5e2db;width:90px">Total</th>
              </tr>
            </thead>
            <tbody>${linesHtml}</tbody>
          </table>
        </td></tr>

        <!-- Totals -->
        <tr><td style="padding:8px 32px 24px 32px">
          <table role="presentation" align="right" cellpadding="0" cellspacing="0" style="width:260px">
            <tr>
              <td style="padding:6px 0;color:#6b6f7b;font-size:13px">Sous-total</td>
              <td style="padding:6px 0;text-align:right;color:#1a1f36;font-variant-numeric:tabular-nums;font-size:13px">${eur(doc.subtotal)}</td>
            </tr>
            ${taxBlock}
            <tr>
              <td style="padding:10px 0 0 0;border-top:1px solid #e5e2db;color:#1a1f36;font-size:14px;font-weight:500">Total TTC</td>
              <td style="padding:10px 0 0 0;border-top:1px solid #e5e2db;text-align:right;color:#1a1f36;font-size:22px;font-weight:600;font-variant-numeric:tabular-nums;letter-spacing:-0.01em">${eur(doc.total)}</td>
            </tr>
          </table>
        </td></tr>

        ${notesBlock}
        ${termsBlock}

        <!-- Footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid #e5e2db;text-align:center;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#9aa0aa">
          Maore-Tech · Mamoudzou, Mayotte 976
        </td></tr>
      </table>

      <div style="max-width:620px;text-align:center;padding-top:14px;color:#9aa0aa;font-size:11px">
        Cet email a été envoyé depuis le CRM Maore-Tech.
      </div>
    </td></tr>
  </table>
</body></html>`;

  return { subject, html };
}
