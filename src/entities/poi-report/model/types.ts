export type PoiReportStatus = "new" | "resolved";

export type PoiReport = {
  id: string;
  poiId: string;
  poiName: string;
  regionId: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  message: string;
  status: PoiReportStatus;
  createdAt: string;
};
