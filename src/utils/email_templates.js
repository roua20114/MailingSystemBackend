/**
 * email_templates.js — Templates HTML pour les emails de notification NexusMail
 * Emplacement : src/utils/email_templates.js
 */

'use strict';

// ── Styles partagés ───────────────────────────────────────────────────────────
const BASE_STYLES = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f4f6f9;
  margin: 0;
  padding: 0;
`;

const CARD_STYLE = `
  max-width: 600px;
  margin: 40px auto;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
`;

const HEADER_STYLE = (color = '#4F46E5') => `
  background: ${color};
  padding: 28px 32px;
  text-align: center;
`;

const BODY_STYLE = `
  padding: 32px;
  color: #1a202c;
`;

const FOOTER_STYLE = `
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  padding: 16px 32px;
  text-align: center;
  font-size: 11px;
  color: #94a3b8;
`;

const BADGE_STYLE = (color = '#4F46E5') => `
  display: inline-block;
  background: ${color}15;
  color: ${color};
  border: 1px solid ${color}30;
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

const BTN_STYLE = (color = '#4F46E5') => `
  display: inline-block;
  margin-top: 20px;
  padding: 12px 28px;
  background: ${color};
  color: #ffffff !important;
  text-decoration: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
`;

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';

// ── Wrapper générique ─────────────────────────────────────────────────────────
const wrap = (headerColor, icon, headerTitle, body) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${headerTitle}</title>
</head>
<body style="${BASE_STYLES}">
  <div style="${CARD_STYLE}">
    <!-- Header -->
    <div style="${HEADER_STYLE(headerColor)}">
      <div style="font-size: 36px; margin-bottom: 8px;">${icon}</div>
      <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700;">${headerTitle}</h1>
      <p style="margin: 4px 0 0; color: rgba(255,255,255,0.75); font-size: 13px;">NexusMail — Système de gestion du courrier</p>
    </div>

    <!-- Body -->
    <div style="${BODY_STYLE}">
      ${body}
    </div>

    <!-- Footer -->
    <div style="${FOOTER_STYLE}">
      Cet email a été envoyé automatiquement par NexusMail. Merci de ne pas y répondre directement.
      <br/>© ${new Date().getFullYear()} NexusMail. Tous droits réservés.
    </div>
  </div>
</body>
</html>
`;

// ── Template 1 : Assignation de courrier ─────────────────────────────────────

/**
 * @param {object} p
 * @param {string} p.recipientName   - Nom du destinataire
 * @param {string} p.mailSubject     - Objet du courrier
 * @param {string} p.referenceNumber - Référence auto (NM-YYYY-XXXX)
 * @param {string} p.manualReference - Référence manuelle (optionnelle)
 * @param {string} p.senderName      - Nom de l'expéditeur du courrier
 * @param {string} p.directorName    - Nom du directeur qui a assigné
 * @param {string} p.instructions    - Instructions éventuelles
 * @param {string} p.mailId          - ID MongoDB du courrier (pour le lien)
 * @param {string} p.priority        - Priorité (Low/Medium/High/Urgent)
 * @returns {string} HTML
 */
const mailAssigned = ({
  recipientName,
  mailSubject,
  referenceNumber,
  manualReference,
  senderName,
  directorName,
  instructions,
  mailId,
  priority,
}) => {
  const priorityColor = {
    Urgent: '#DC2626',
    High:   '#EA580C',
    Medium: '#2563EB',
    Low:    '#6B7280',
  }[priority] || '#2563EB';

  const body = `
    <p style="font-size: 16px; margin-top: 0;">Bonjour <strong>${recipientName}</strong>,</p>

    <p style="color: #4a5568; line-height: 1.6;">
      Le directeur <strong>${directorName}</strong> vous a assigné un courrier qui nécessite votre attention.
    </p>

    <!-- Fiche courrier -->
    <div style="
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #4F46E5;
      border-radius: 8px;
      padding: 20px 24px;
      margin: 20px 0;
    ">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 12px; width: 140px; vertical-align: top;">Objet</td>
          <td style="padding: 6px 0; font-weight: 600; font-size: 14px;">${mailSubject}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 12px; vertical-align: top;">Réf. système</td>
          <td style="padding: 6px 0; font-family: monospace; font-size: 13px;">${referenceNumber}</td>
        </tr>
        ${manualReference ? `
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 12px; vertical-align: top;">Réf. document</td>
          <td style="padding: 6px 0; font-family: monospace; font-size: 13px;">${manualReference}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 12px; vertical-align: top;">Expéditeur</td>
          <td style="padding: 6px 0;">${senderName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 12px; vertical-align: top;">Priorité</td>
          <td style="padding: 6px 0;">
            <span style="${BADGE_STYLE(priorityColor)}">${priority}</span>
          </td>
        </tr>
        ${instructions ? `
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 12px; vertical-align: top;">Instructions</td>
          <td style="padding: 6px 0; color: #374151; font-style: italic;">"${instructions}"</td>
        </tr>
        ` : ''}
      </table>
    </div>

    <p style="color: #4a5568; line-height: 1.6;">
      Veuillez prendre en charge ce courrier dans les meilleurs délais et mettre à jour son statut sur la plateforme.
    </p>

    <div style="text-align: center;">
      <a href="${frontendUrl}/mails/${mailId}" style="${BTN_STYLE('#4F46E5')}">
        Voir le courrier →
      </a>
    </div>
  `;

  return wrap('#4F46E5', '📋', 'Courrier assigné', body);
};

// ── Template 2 : Alerte SLA ───────────────────────────────────────────────────

/**
 * @param {object} p
 * @param {string} p.recipientName   - Nom du destinataire
 * @param {string} p.mailSubject     - Objet du courrier
 * @param {string} p.referenceNumber - Référence auto
 * @param {string} p.manualReference - Référence manuelle (optionnelle)
 * @param {string} p.slaDeadline     - Date d'échéance (ISO string)
 * @param {string} p.mailId          - ID MongoDB du courrier
 * @param {string} p.hoursRemaining  - Heures restantes avant échéance
 * @returns {string} HTML
 */
const slaAlert = ({
  recipientName,
  mailSubject,
  referenceNumber,
  manualReference,
  slaDeadline,
  mailId,
  hoursRemaining,
}) => {
  const deadline = slaDeadline
    ? new Date(slaDeadline).toLocaleDateString('fr-FR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : '—';

  const urgencyColor = (hoursRemaining !== undefined && hoursRemaining <= 24)
    ? '#DC2626'
    : '#EA580C';

  const body = `
    <p style="font-size: 16px; margin-top: 0;">Bonjour <strong>${recipientName}</strong>,</p>

    <!-- Bannière d'alerte -->
    <div style="
      background: ${urgencyColor}10;
      border: 1px solid ${urgencyColor}30;
      border-left: 4px solid ${urgencyColor};
      border-radius: 8px;
      padding: 16px 20px;
      margin: 16px 0;
      display: flex;
      align-items: center;
      gap: 12px;
    ">
      <span style="font-size: 24px;">⏰</span>
      <div>
        <p style="margin: 0; font-weight: 700; color: ${urgencyColor}; font-size: 14px;">
          ${hoursRemaining !== undefined && hoursRemaining <= 24
            ? `Échéance dans moins de ${Math.max(0, Math.round(hoursRemaining))} heures !`
            : 'Échéance SLA imminente'}
        </p>
        <p style="margin: 4px 0 0; color: #374151; font-size: 13px;">
          Ce courrier doit être traité avant le <strong>${deadline}</strong>.
        </p>
      </div>
    </div>

    <!-- Fiche courrier -->
    <div style="
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid ${urgencyColor};
      border-radius: 8px;
      padding: 20px 24px;
      margin: 20px 0;
    ">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 12px; width: 140px;">Objet</td>
          <td style="padding: 6px 0; font-weight: 600; font-size: 14px;">${mailSubject}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 12px;">Réf. système</td>
          <td style="padding: 6px 0; font-family: monospace; font-size: 13px;">${referenceNumber}</td>
        </tr>
        ${manualReference ? `
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 12px;">Réf. document</td>
          <td style="padding: 6px 0; font-family: monospace; font-size: 13px;">${manualReference}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 12px;">Échéance SLA</td>
          <td style="padding: 6px 0;">
            <span style="${BADGE_STYLE(urgencyColor)}">${deadline}</span>
          </td>
        </tr>
      </table>
    </div>

    <p style="color: #4a5568; line-height: 1.6;">
      Merci de traiter ce courrier en priorité et de mettre à jour son statut sur NexusMail.
    </p>

    <div style="text-align: center;">
      <a href="${frontendUrl}/mails/${mailId}" style="${BTN_STYLE(urgencyColor)}">
        Traiter maintenant →
      </a>
    </div>
  `;

  return wrap(urgencyColor, '⚠️', 'Alerte SLA — Échéance proche', body);
};

// ── Template 3 : Nouveau courrier enregistré ──────────────────────────────────

/**
 * @param {object} p
 * @param {string} p.recipientName    - Nom du directeur/admin destinataire
 * @param {string} p.mailSubject      - Objet du courrier
 * @param {string} p.referenceNumber  - Référence auto
 * @param {string} p.manualReference  - Référence manuelle (optionnelle)
 * @param {string} p.registeredByName - Nom de la secrétaire/directeur qui a enregistré
 * @param {string} p.mailType         - Type (Incoming/Outgoing/Internal)
 * @param {string} p.priority         - Priorité
 * @param {string} p.mailId           - ID MongoDB
 * @returns {string} HTML
 */
const mailRegistered = ({
  recipientName,
  mailSubject,
  referenceNumber,
  manualReference,
  registeredByName,
  mailType,
  priority,
  mailId,
}) => {
  const typeLabel = { Incoming: 'Entrant', Outgoing: 'Sortant', Internal: 'Interne' }[mailType] || mailType;

  const body = `
    <p style="font-size: 16px; margin-top: 0;">Bonjour <strong>${recipientName}</strong>,</p>

    <p style="color: #4a5568; line-height: 1.6;">
      Un nouveau courrier a été enregistré par <strong>${registeredByName}</strong> et est en attente de votre dispatching.
    </p>

    <div style="
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #059669;
      border-radius: 8px;
      padding: 20px 24px;
      margin: 20px 0;
    ">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 12px; width: 140px;">Objet</td>
          <td style="padding: 6px 0; font-weight: 600; font-size: 14px;">${mailSubject}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 12px;">Réf. système</td>
          <td style="padding: 6px 0; font-family: monospace; font-size: 13px;">${referenceNumber}</td>
        </tr>
        ${manualReference ? `
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 12px;">Réf. document</td>
          <td style="padding: 6px 0; font-family: monospace; font-size: 13px;">${manualReference}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 12px;">Type</td>
          <td style="padding: 6px 0;"><span style="${BADGE_STYLE('#059669')}">${typeLabel}</span></td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-size: 12px;">Priorité</td>
          <td style="padding: 6px 0;">${priority}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center;">
      <a href="${frontendUrl}/mails/${mailId}" style="${BTN_STYLE('#059669')}">
        Dispatcher le courrier →
      </a>
    </div>
  `;

  return wrap('#059669', '📬', 'Nouveau courrier à dispatcher', body);
};

module.exports = { mailAssigned, slaAlert, mailRegistered };