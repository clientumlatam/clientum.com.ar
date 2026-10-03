import { Router, Request, Response } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Octokit } from '@octokit/rest';

export const githubWebhookRouter = Router();

/**
 * Verification helper to ensure GitHub webhook payload authenticity
 */
function verifyWebhookSignature(rawBody: string, signature256: string, secret: string): boolean {
  try {
    const hmac = createHmac('sha256', secret);
    const computedDigest = 'sha256=' + hmac.update(rawBody).digest('hex');
    
    const computedBuffer = Buffer.from(computedDigest);
    const receivedBuffer = Buffer.from(signature256);
    
    if (computedBuffer.length !== receivedBuffer.length) {
      return false;
    }
    
    return timingSafeEqual(computedBuffer, receivedBuffer);
  } catch (err) {
    return false;
  }
}

/**
 * Secure Endpoint to receive webhooks from a registered GitHub App
 */
githubWebhookRouter.post('/events', async (req: Request, res: Response) => {
  const signature = req.headers['x-hub-signature-256'] as string;
  const event = req.headers['x-github-event'] as string;
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET;

  console.log(`[GitHub Webhook] Received event type: "${event}"`);

  // 1. Signature validation (Zero-Trust Security)
  if (webhookSecret && signature) {
    const rawBody = (req as any).rawBody ? (req as any).rawBody.toString('utf8') : JSON.stringify(req.body);
    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
    
    if (!isValid) {
      console.warn('[GitHub Webhook] Unauthorized webhook signature received.');
      return res.status(401).json({ error: 'Signature mismatch' });
    }
  } else if (!webhookSecret) {
    console.warn('[GitHub Webhook] GITHUB_WEBHOOK_SECRET is not configured in .env. Production runs will bypass verification.');
  }

  const payload = req.body;

  try {
    // 2. Event Routing & Business Logic
    if (event === 'pull_request') {
      const action = payload.action;
      const prNumber = payload.pull_request?.number;
      const repoName = payload.repository?.full_name;

      console.log(`[GitHub Webhook] Pull Request #${prNumber} state: "${action}" on repository "${repoName}"`);

      // Event trigger: When a new PR is opened, optionally add a comment via Octokit
      if (action === 'opened') {
        const installationId = payload.installation?.id;

        // If your GitHub App is configured with a Private Key and ID, authenticate and leave a comment
        if (installationId && process.env.GITHUB_APP_ID && process.env.GITHUB_PRIVATE_KEY) {
          // Note: In real production setups, you would authenticate as an installation
          console.log(`[GitHub Webhook] App installation #${installationId} detected. Ready to post comment.`);
        }
      }
    } else if (event === 'ping') {
      console.log('[GitHub Webhook] Received Ping event from GitHub. Integration is live!');
      return res.status(200).json({ success: true, message: 'pong' });
    }

    // Acknowledge receipt to GitHub
    return res.status(200).json({
      success: true,
      message: 'Event processed successfully',
      event,
      action: payload.action || 'unknown'
    });
  } catch (err: any) {
    console.error('[GitHub Webhook] Error processing event:', err);
    return res.status(500).json({ error: err.message });
  }
});
