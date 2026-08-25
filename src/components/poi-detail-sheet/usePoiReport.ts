import { useState } from "react";
import { submitPoiReport } from "@/shared/api/reports";

export function usePoiReport() {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [reportError, setReportError] = useState(false);

  function resetReport() {
    setIsReportOpen(false);
    setReportMessage("");
    setReportSent(false);
    setReportError(false);
  }

  async function handleSubmitReport(poiId: string) {
    if (!reportMessage.trim() || isSendingReport) return;
    setIsSendingReport(true);
    setReportError(false);
    try {
      await submitPoiReport(poiId, reportMessage.trim());
      setReportSent(true);
    } catch {
      setReportError(true);
    } finally {
      setIsSendingReport(false);
    }
  }

  return {
    isReportOpen,
    setIsReportOpen,
    reportMessage,
    setReportMessage,
    isSendingReport,
    reportSent,
    reportError,
    resetReport,
    handleSubmitReport
  };
}
