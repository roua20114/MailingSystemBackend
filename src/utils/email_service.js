/**
 * email_service.js — Service d'envoi d'emails via Nodemailer
 * Emplacement : src/utils/email_service.js
 *
 * Toutes les erreurs SMTP sont interceptées silencieusement :
 * un échec d'envoi d'email ne doit JAMAIS faire crasher le serveur.
 */

'use strict';

const nodemailer = require('nodemailer');
const logger = require('./logger');

// ── Transporteur SMTP ─────────────────────────────────────────────────────────
// Initialisé une seule fois au démarrage du module (singleton).
// Toutes les valeurs viennent exclusivement des variables d'environnement.
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_PORT === '465', // true pour le port 465 (SSL), false sinon (TLS STARTTLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Timeout généreux pour éviter les blocages silencieux
  connectionTimeout: 10_000,
  greetingTimeout:   5_000,
  socketTimeout:     15_000,
});

// Vérification de la connexion SMTP au démarrage (non-bloquant)
if (process.env.SMTP_HOST) {
  transporter.verify((err) => {
    if (err) {
      logger.warn(`[EmailService] Connexion SMTP échouée au démarrage : ${err.message}`);
    } else {
      logger.info('[EmailService] Connexion SMTP vérifiée avec succès ✓');
    }
  });
}

// ── Fonction principale d'envoi ───────────────────────────────────────────────

/**
 * Envoie un email HTML.
 *
 * @param {object} options
 * @param {string}   options.to      - Adresse email du destinataire
 * @param {string}   options.subject - Sujet de l'email
 * @param {string}   options.html    - Corps HTML de l'email
 * @returns {Promise<void>}
 */
const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    logger.warn('[EmailService] Variables SMTP non configurées — email non envoyé.');
    return;
  }

  if (!to || !subject || !html) {
    logger.warn('[EmailService] Paramètres incomplets (to/subject/html) — email ignoré.');
    return;
  }

  try {
    const info = await transporter.sendMail({
      from:    process.env.SMTP_FROM || `"NexusMail" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    logger.info(`[EmailService] Email envoyé → ${to} | messageId: ${info.messageId}`);
  } catch (err) {
    // Erreur SMTP : loguée mais JAMAIS propagée — le serveur continue à fonctionner
    logger.error(`[EmailService] Échec d'envoi vers ${to} : ${err.message}`);
  }
};

module.exports = { sendEmail };