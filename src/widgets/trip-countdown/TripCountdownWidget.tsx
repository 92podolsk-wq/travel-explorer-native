import {
  FlexWidget,
  ImageWidget,
  OverlapWidget,
  TextWidget,
  requestWidgetUpdate,
  type WidgetTaskHandler
} from "react-native-android-widget";
import { getWidgetTripSummary, TRIP_COUNTDOWN_WIDGET_NAME, type WidgetTripSummary } from "@/shared/storage/widget-trip-summary";

const HERO_GRADIENT_START = "#1c4842";

// Cat-mascot illustrations by countdown mood — swapped for the day count, never a photo of the destination.
const ILLUSTRATIONS = {
  day1: require("./assets/day-1.jpg"),
  day2: require("./assets/day-2.jpg"),
  day3: require("./assets/day-3.jpg"),
  day3to10: require("./assets/day-3-10.jpg"),
  day10plus: require("./assets/day-10-plus.jpg")
};

function pickIllustration(days: number | null) {
  if (days == null) return null;
  if (days <= 1) return ILLUSTRATIONS.day1;
  if (days === 2) return ILLUSTRATIONS.day2;
  if (days === 3) return ILLUSTRATIONS.day3;
  if (days <= 10) return ILLUSTRATIONS.day3to10;
  return ILLUSTRATIONS.day10plus;
}

function daysUntil(startDate: string): number {
  const now = new Date();
  const start = new Date(startDate);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTrip = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  return Math.round((startOfTrip.getTime() - startOfToday.getTime()) / 86_400_000);
}

export function TripCountdownWidget({ summary }: { summary: WidgetTripSummary | null }) {
  const days = summary?.startDate ? daysUntil(summary.startDate) : null;
  const illustration = pickIllustration(days);

  let headline: string;
  if (days == null) {
    headline = "Задайте дату поездки";
  } else if (days > 1) {
    headline = `${days} дн. до поездки`;
  } else if (days === 1) {
    headline = "Завтра";
  } else if (days === 0) {
    headline = "Сегодня!";
  } else {
    headline = "В пути";
  }

  return (
    <FlexWidget
      style={{ height: "match_parent", width: "match_parent", borderRadius: 20, overflow: "hidden" }}
      clickAction="OPEN_APP"
    >
      <OverlapWidget style={{ height: "match_parent", width: "match_parent" }}>
        {illustration ? (
          <ImageWidget
            image={illustration}
            imageWidth={320}
            imageHeight={180}
            resizeMode="cover"
            style={{ height: "match_parent", width: "match_parent" }}
          />
        ) : (
          <FlexWidget style={{ height: "match_parent", width: "match_parent", backgroundColor: HERO_GRADIENT_START }} />
        )}

        <FlexWidget
          style={{
            height: "match_parent",
            width: "match_parent",
            backgroundColor: "#00000055",
            justifyContent: "flex-end",
            padding: 14
          }}
        >
          <TextWidget
            text={headline}
            style={{ fontSize: 20, fontWeight: "800", color: "#ffffff" }}
            truncate="END"
            maxLines={1}
          />
          {summary?.title ? (
            <TextWidget
              text={summary.title}
              style={{ fontSize: 13, fontWeight: "600", color: "#ffffffcc", marginTop: 2 }}
              truncate="END"
              maxLines={1}
            />
          ) : null}
        </FlexWidget>
      </OverlapWidget>
    </FlexWidget>
  );
}

export const tripCountdownWidgetTaskHandler: WidgetTaskHandler = async (props) => {
  if (props.widgetInfo.widgetName !== TRIP_COUNTDOWN_WIDGET_NAME) return;
  if (props.widgetAction === "WIDGET_DELETED") return;
  const summary = await getWidgetTripSummary();
  props.renderWidget(<TripCountdownWidget summary={summary} />);
};

export function refreshTripCountdownWidget(): void {
  requestWidgetUpdate({
    widgetName: TRIP_COUNTDOWN_WIDGET_NAME,
    renderWidget: async () => <TripCountdownWidget summary={await getWidgetTripSummary()} />
  }).catch(() => {});
}
