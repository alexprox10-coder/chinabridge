import { Suspense } from "react";
import GoogleAnalytics from "./GoogleAnalytics";
import YandexMetrika from "./YandexMetrika";
import MicrosoftClarity from "./MicrosoftClarity";
import VkPixel from "./VkPixel";

export default function AnalyticsProvider() {
  return (
    <>
      <Suspense fallback={null}>
        <GoogleAnalytics />
      </Suspense>
      <Suspense fallback={null}>
        <YandexMetrika />
      </Suspense>
      <MicrosoftClarity />
      <VkPixel />
    </>
  );
}
