import { DatabaseService } from '../../database/db.js';
import { Logger } from '../../shared/logger/logger.js';

export class FeedbackController {
  constructor() {
    this.db = DatabaseService.getInstance();
  }

  /**
   * Moderatör İnceleme Kuyruğu (FLAGGED_FOR_REVIEW olan içerikler)
   */
  getQueue = (_req, res) => {
    const logs = this.db.getLogs(100);
    const queue = logs.filter((log) => log.verdict === 'FLAGGED_FOR_REVIEW');

    res.status(200).json({
      success: true,
      data: queue,
      meta: {
        timestamp: new Date().toISOString(),
        total_pending: queue.length
      }
    });
  };

  /**
   * Moderatör Karar Ezme (Override & Human-in-the-loop Feedback)
   */
  submitOverride = (req, res) => {
    const { log_id, moderator_verdict, reason, moderator_id } = req.body;

    if (!log_id || !moderator_verdict) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_FEEDBACK', message: 'log_id ve moderator_verdict alanları zorunludur.' }
      });
      return;
    }

    const feedbackRecord = {
      id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      log_id,
      moderator_verdict, // 'APPROVED' | 'REJECTED'
      reason: reason || 'Moderatör Kararı',
      moderator_id: moderator_id || 'mod_admin',
      created_at: new Date().toISOString()
    };

    // DB'deki log kararını güncelle
    const logs = this.db.getLogs(500);
    const targetLog = logs.find((l) => l.id === log_id);
    if (targetLog) {
      targetLog.verdict = moderator_verdict;
    }

    Logger.info('Human Moderator Override Submitted', { feedbackRecord });

    res.status(200).json({
      success: true,
      data: feedbackRecord,
      message: 'Moderatör geri bildirimi başarıyla kaydedildi.'
    });
  };

  /**
   * AI Re-Training İçin Veri Seti Dışa Aktarma (Export)
   */
  exportDataset = (_req, res) => {
    const logs = this.db.getLogs(500);
    
    // Sadece moderatör kararları verilmiş veya net sonuçlanan verileri veri setine çevir
    const dataset = logs.map((log) => ({
      text: log.sanitized_text || log.text,
      verdict: log.verdict,
      risk_score: log.risk_score,
      violations: log.violations
    }));

    res.status(200).json({
      success: true,
      count: dataset.length,
      data: dataset
    });
  };
}
