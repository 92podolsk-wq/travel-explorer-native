import { renderHook, waitFor } from "@testing-library/react-native";
import { usePoiReport } from "./usePoiReport";

jest.mock("@/shared/api/reports", () => ({ submitPoiReport: jest.fn() }));

import { submitPoiReport } from "@/shared/api/reports";

describe("usePoiReport", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does nothing when the message is blank", async () => {
    const { result } = await renderHook(() => usePoiReport());
    await result.current.handleSubmitReport("poi-1");
    expect(submitPoiReport).not.toHaveBeenCalled();
  });

  it("submits the trimmed message and marks it sent on success", async () => {
    (submitPoiReport as jest.Mock).mockResolvedValue(undefined);
    const { result, rerender } = await renderHook(() => usePoiReport());

    result.current.setReportMessage("  broken bench  ");
    await rerender({});
    await result.current.handleSubmitReport("poi-1");

    expect(submitPoiReport).toHaveBeenCalledWith("poi-1", "broken bench");
    await waitFor(() => expect(result.current.reportSent).toBe(true));
    expect(result.current.reportError).toBe(false);
  });

  it("sets reportError instead of reportSent when the submission fails", async () => {
    (submitPoiReport as jest.Mock).mockRejectedValue(new Error("network down"));
    const { result, rerender } = await renderHook(() => usePoiReport());

    result.current.setReportMessage("broken bench");
    await rerender({});
    await result.current.handleSubmitReport("poi-1");

    await waitFor(() => expect(result.current.reportError).toBe(true));
    expect(result.current.reportSent).toBe(false);
  });

  it("resetReport clears the open/message/sent/error state", async () => {
    (submitPoiReport as jest.Mock).mockRejectedValue(new Error("network down"));
    const { result, rerender } = await renderHook(() => usePoiReport());

    result.current.setIsReportOpen(true);
    result.current.setReportMessage("broken bench");
    await rerender({});
    await result.current.handleSubmitReport("poi-1");
    await waitFor(() => expect(result.current.reportError).toBe(true));

    result.current.resetReport();
    await rerender({});

    expect(result.current.isReportOpen).toBe(false);
    expect(result.current.reportMessage).toBe("");
    expect(result.current.reportSent).toBe(false);
    expect(result.current.reportError).toBe(false);
  });
});
